const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect, authorize } = require('../middleware/auth');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder
} = require('../controllers/orderController');

// @route   POST /wc/v3/orders
// @desc    Create new order
// @access  Private
router.post(
    '/wc/v3/orders',
    protect,
    [
        body('payment_method').notEmpty().withMessage('Payment method is required'),
        body('payment_method_title').notEmpty().withMessage('Payment method title is required'),
        body('billing.firstName').notEmpty().withMessage('Billing first name is required'),
        body('billing.lastName').notEmpty().withMessage('Billing last name is required'),
        body('billing.address1').notEmpty().withMessage('Billing address is required'),
        body('billing.city').notEmpty().withMessage('Billing city is required'),
        body('billing.state').notEmpty().withMessage('Billing state is required'),
        body('billing.postcode').notEmpty().withMessage('Billing postcode is required'),
        body('billing.country').notEmpty().withMessage('Billing country is required'),
        body('billing.email').isEmail().withMessage('Valid billing email is required'),
        body('billing.phone').notEmpty().withMessage('Billing phone is required'),
        body('line_items').isArray({ min: 1 }).withMessage('At least one line item is required'),
        validate
    ],
    createOrder
);

// @route   GET /wc/v3/orders
// @desc    Get all orders for authenticated user
// @access  Private
router.get('/wc/v3/orders', protect, getOrders);

// @route   GET /wc/v3/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/wc/v3/orders/:id', protect, getOrder);

// @route   PUT /wc/v3/orders/:id
// @desc    Update order
// @access  Private/Admin
router.put('/wc/v3/orders/:id', protect, authorize('admin'), updateOrder);

// @route   DELETE /wc/v3/orders/:id
// @desc    Delete order
// @access  Private/Admin
router.delete('/wc/v3/orders/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;