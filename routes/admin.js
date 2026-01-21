const router = require('express').Router();
const User = require('../models/User');
const SiteStats = require('../models/SiteStats');
const Announcement = require('../models/Announcement');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Admin
const Attempt = require('../models/Attempt'); // Ensure Attempt is imported

// @route   POST /api/admin/cleanup-duplicates
// @desc    Remove duplicate attempts (keep highest score)
// @access  Admin
router.post('/cleanup-duplicates', protect, admin, async (req, res) => {
    try {
        // 1. Find all attempts and POPULATE user details to get email
        const allAttempts = await Attempt.find({})
            .populate('userId', 'email') // Get the actual email from User model
            .sort({ score: -1, createdAt: -1 });

        const seen = new Set();
        const duplicates = [];

        // 2. Identify duplicates
        for (const attempt of allAttempts) {
            // Determine the unique identifier (Email is best, fallback to User ID, then studentId)
            let uniqueId = null;

            if (attempt.userId && attempt.userId.email) {
                uniqueId = attempt.userId.email;
            } else if (attempt.studentId) {
                uniqueId = attempt.studentId;
            } else if (attempt.userId) {
                uniqueId = attempt.userId.toString(); // Fallback to ID if email populate failed
            } else {
                continue; // Can't identify user, skip
            }

            // Create unique key: Quiz + UserIdentity
            const key = `${attempt.quizId}-${uniqueId}`;

            if (seen.has(key)) {
                // If we've seen this key (better score was already processed due to sort), this is a dupe
                console.log(`Found duplicate for ${uniqueId} on quiz ${attempt.quizId}`);
                duplicates.push(attempt._id);
            } else {
                seen.add(key);
            }
        }

        // 3. Delete duplicates
        if (duplicates.length > 0) {
            await Attempt.deleteMany({ _id: { $in: duplicates } });
        }

        res.json({
            message: `Cleanup complete. Removed ${duplicates.length} duplicate entries.`,
            removedCount: duplicates.length
        });

    } catch (error) {
        console.error("Cleanup Error:", error);
        res.status(500).json({ message: 'Failed to cleanup duplicates' });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const stats = await SiteStats.findOne() || { totalVisits: 0, uniqueVisitors: [] };

        res.json({
            totalUsers: userCount,
            totalAdmins: adminCount,
            totalVisits: stats.totalVisits,
            uniqueVisitors: stats.uniqueVisitors ? stats.uniqueVisitors.length : 0,
            dbStatus: 'Connected' // If we are here, DB is connected
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   POST /api/admin/announcement
// @desc    Create announcement
// @access  Admin
router.post('/announcement', protect, admin, async (req, res) => {
    try {
        const { message, type } = req.body;
        const announcement = await Announcement.create({
            message,
            type,
            createdBy: req.user._id
        });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create announcement' });
    }
});

// @route   DELETE /api/admin/announcement/:id
// @desc    Delete announcement
// @access  Admin
router.delete('/announcement/:id', protect, admin, async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete' });
    }
});

// @route   PATCH /api/admin/announcement/:id/toggle
// @desc    Toggle announcement active status
// @access  Admin
router.patch('/announcement/:id/toggle', protect, admin, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        announcement.isActive = !announcement.isActive;
        await announcement.save();
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle' });
    }
});

// @route   GET /api/admin/announcements/all
// @desc    Get all announcements for admin
// @access  Admin
router.get('/announcements/all', protect, admin, async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch announcements' });
    }
});

// @route   GET /api/admin/announcements/public
// @desc    Get active announcements for users
// @access  Public
router.get('/announcements/public', async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch announcements' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

module.exports = router;
