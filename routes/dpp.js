const express = require('express');
const DPP = require('../models/DPP');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all active DPPs (public)
router.get('/all', async (req, res) => {
    try {
        const dpps = await DPP.find({ isActive: true })
            .sort({ publishDate: -1 })
            .select('-__v');

        res.json({ dpps });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all DPPs for admin (includes inactive)
router.get('/admin/all', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dpps = await DPP.find({})
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({ dpps });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single DPP by slug
router.get('/:slug', async (req, res) => {
    try {
        const dpp = await DPP.findOne({ slug: req.params.slug, isActive: true });

        if (!dpp) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        res.json(dpp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new DPP (Admin only)
router.post('/create', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { title, slug, difficulty, tags, description, leetcodeUrl, publishDate } = req.body;

        // Generate slug if not provided
        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const dpp = new DPP({
            title,
            slug: finalSlug,
            difficulty,
            tags: tags || [],
            description,
            leetcodeUrl: leetcodeUrl || null,
            publishDate: publishDate || new Date()
        });

        await dpp.save();

        res.status(201).json({ message: 'DPP created successfully', dpp });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A problem with this slug already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// PUT update DPP (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { title, slug, difficulty, tags, description, leetcodeUrl, publishDate, isActive } = req.body;

        const dpp = await DPP.findByIdAndUpdate(
            req.params.id,
            { title, slug, difficulty, tags, description, leetcodeUrl, publishDate, isActive },
            { new: true, runValidators: true }
        );

        if (!dpp) {
            return res.status(404).json({ message: 'DPP not found' });
        }

        res.json({ message: 'DPP updated successfully', dpp });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH toggle DPP status (Admin only)
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dpp = await DPP.findById(req.params.id);
        if (!dpp) {
            return res.status(404).json({ message: 'DPP not found' });
        }

        dpp.isActive = !dpp.isActive;
        await dpp.save();

        res.json({
            message: `DPP ${dpp.isActive ? 'published' : 'unpublished'}`,
            isActive: dpp.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE DPP (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dpp = await DPP.findByIdAndDelete(req.params.id);

        if (!dpp) {
            return res.status(404).json({ message: 'DPP not found' });
        }

        res.json({ message: 'DPP deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
