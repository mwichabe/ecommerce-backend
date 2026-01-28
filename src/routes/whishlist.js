const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect } = require('../middleware/auth');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require('../controllers/customerWhishlistController');

// @route   GET /tradebakerz/wc/v1/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/tradebakerz/wc/v1/wishlist', protect, getWishlist);

// @route   POST /tradebakerz/wc/v1/wishlist/add
// @desc    Add product to wishlist
// @access  Private
router.post(
    '/tradebakerz/wc/v1/wishlist/add',
    protect,
    [
        body('product_id').notEmpty().withMessage('Product ID is required'),
        validate
    ],
    addToWishlist
);

// @route   DELETE /tradebakerz/wc/v1/wishlist/:product_id
// @desc    Remove product from wishlist
// @access  Private
router.delete('/tradebakerz/wc/v1/wishlist/:product_id', protect, removeFromWishlist);

module.exports = router;