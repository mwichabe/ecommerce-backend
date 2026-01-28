const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require('../controllers/categoryCartController');

// @route   GET /wc/v3/cart
// @desc    Get user's shopping cart
// @access  Private
router.get('/wc/v3/cart', protect, getCart);

// @route   POST /wc/v3/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/wc/v3/cart/add', protect, addToCart);

// @route   POST /wc/v3/cart/update-item
// @desc    Update cart item quantity
// @access  Private
router.post('/wc/v3/cart/update-item', protect, updateCartItem);

// @route   POST /wc/v3/cart/remove-item
// @desc    Remove item from cart
// @access  Private
router.post('/wc/v3/cart/remove-item', protect, removeCartItem);

// @route   POST /wc/v3/cart/clear
// @desc    Clear entire cart
// @access  Private
router.post('/wc/v3/cart/clear', protect, clearCart);

module.exports = router;