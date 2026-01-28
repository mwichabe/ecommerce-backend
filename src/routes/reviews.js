const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect } = require('../middleware/auth');
const {
    getReviews,
    createReview
} = require('../controllers/customerWhishlistController');

// @route   GET /wc/v3/products/reviews
// @desc    Get product reviews
// @access  Public
router.get('/wc/v3/products/reviews', getReviews);

// @route   POST /wc/v3/products/reviews
// @desc    Create a product review
// @access  Private
router.post(
    '/wc/v3/products/reviews',
    protect,
    [
        body('product_id').notEmpty().withMessage('Product ID is required'),
        body('review').notEmpty().withMessage('Review text is required')
            .isLength({ max: 2000 }).withMessage('Review cannot exceed 2000 characters'),
        body('rating').notEmpty().withMessage('Rating is required')
            .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        validate
    ],
    createReview
);

module.exports = router;