const router = require('express').Router();
const User = require('../models/User');
const SiteStats = require('../models/SiteStats');
const Announcement = require('../models/Announcement');
const { protect, admin } = require('../middleware/authMiddleware');

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
