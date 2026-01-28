const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect, authorize } = require('../middleware/auth');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} = require('../controllers/productController');

// @route   GET /wc/v3/products
// @desc    Get all products with filters and pagination
// @access  Public
// @query   page, per_page, category, search, orderby, order, featured, on_sale
router.get('/wc/v3/products', getProducts);

// @route   GET /wc/v3/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/wc/v3/products/:id', getProduct);

// @route   POST /wc/v3/products
// @desc    Create new product
// @access  Private/Admin
router.post(
    '/wc/v3/products',
    protect,
    authorize('admin'),
    [
        body('name').notEmpty().withMessage('Product name is required')
            .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
        body('price').notEmpty().withMessage('Product price is required')
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('description').notEmpty().withMessage('Product description is required'),
        body('stockQuantity').optional()
            .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
        validate
    ],
    createProduct
);

// @route   PUT /wc/v3/products/:id
// @desc    Update product
// @access  Private/Admin
router.put(
    '/wc/v3/products/:id',
    protect,
    authorize('admin'),
    [
        body('name').optional()
            .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
        body('price').optional()
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stockQuantity').optional()
            .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
        validate
    ],
    updateProduct
);

// @route   DELETE /wc/v3/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/wc/v3/products/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;