const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryCartController');

// @route   GET /wc/v3/products/categories
// @desc    Get all categories
// @access  Public
router.get('/wc/v3/products/categories', getCategories);

// @route   GET /wc/v3/products/categories/:id
// @desc    Get single category
// @access  Public
router.get('/wc/v3/products/categories/:id', getCategory);

// @route   POST /wc/v3/products/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/wc/v3/products/categories', protect, authorize('admin'), createCategory);

// @route   PUT /wc/v3/products/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/wc/v3/products/categories/:id', protect, authorize('admin'), updateCategory);

// @route   DELETE /wc/v3/products/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/wc/v3/products/categories/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;