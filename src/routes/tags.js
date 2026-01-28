const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Tag } = require('../models');

// @route   GET /wc/v3/products/tags
// @desc    Get all product tags
// @access  Public
router.get('/wc/v3/products/tags', async (req, res, next) => {
    try {
        const {
            page = 1,
            per_page = 10,
            search,
            hide_empty = false
        } = req.query;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (hide_empty === 'true') {
            query.count = { $gt: 0 };
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const tags = await Tag.find(query)
            .sort({ name: 1 })
            .limit(limit)
            .skip(skip);

        const total = await Tag.countDocuments(query);

        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(tags);
    } catch (error) {
        next(error);
    }
});

// @route   GET /wc/v3/products/tags/:id
// @desc    Get single tag
// @access  Public
router.get('/wc/v3/products/tags/:id', async (req, res, next) => {
    try {
        const tag = await Tag.findById(req.params.id);

        if (!tag) {
            return res.status(404).json({
                code: 'tag_not_found',
                message: 'Tag not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(tag);
    } catch (error) {
        next(error);
    }
});

// @route   POST /wc/v3/products/tags
// @desc    Create new tag
// @access  Private/Admin
router.post('/wc/v3/products/tags', protect, authorize('admin'), async (req, res, next) => {
    try {
        const tag = await Tag.create(req.body);
        res.status(201).json(tag);
    } catch (error) {
        next(error);
    }
});

// @route   PUT /wc/v3/products/tags/:id
// @desc    Update tag
// @access  Private/Admin
router.put('/wc/v3/products/tags/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const tag = await Tag.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!tag) {
            return res.status(404).json({
                code: 'tag_not_found',
                message: 'Tag not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(tag);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /wc/v3/products/tags/:id
// @desc    Delete tag
// @access  Private/Admin
router.delete('/wc/v3/products/tags/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const tag = await Tag.findById(req.params.id);

        if (!tag) {
            return res.status(404).json({
                code: 'tag_not_found',
                message: 'Tag not found',
                data: { status: 404 }
            });
        }

        await tag.deleteOne();

        res.status(200).json({
            id: tag._id,
            deleted: true
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;