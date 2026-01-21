const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const passport = require('../config/passport');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper to get IP
const getIp = (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
};

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user
        const user = new User({
            email,
            password,
            name,
            ipAddress: getIp(req)
        });
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update IP
        user.ipAddress = getIp(req);
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/auth/me - Get current user (protected)
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user.toJSON() });
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/google - Initiate Google OAuth
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`
    }),
    (req, res) => {
        // Update IP for Google Users
        // Note: We need to do this async but we are in a non-async callback wrapper if not careful.
        // However, express handlers support async. But here it is defined as (req, res) =>.
        // We can just fire and forget or wrap it.
        // Best approach is properly wait.
        const updateUserIp = async () => {
            if (req.user) {
                req.user.ipAddress = getIp(req);
                await req.user.save();
            }
        };
        updateUserIp();

        // Generate JWT token
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/login?token=${token}`);
    }
);

module.exports = router;
