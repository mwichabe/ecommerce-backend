const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect } = require('../middleware/auth');
const {
    getCustomer,
    updateCustomer
} = require('../controllers/customerWhishlistController');

// @route   GET /wc/v3/customers/:id
// @desc    Get customer profile
// @access  Private
router.get('/wc/v3/customers/:id', protect, getCustomer);

// @route   PUT /wc/v3/customers/:id
// @desc    Update customer profile
// @access  Private
router.put(
    '/wc/v3/customers/:id',
    protect,
    [
        body('email').optional().isEmail().withMessage('Please provide a valid email'),
        body('billing.email').optional().isEmail().withMessage('Please provide a valid billing email'),
        validate
    ],
    updateCustomer
);

module.exports = router;