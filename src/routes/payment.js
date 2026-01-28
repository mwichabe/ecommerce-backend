const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Payment methods configuration
const paymentMethods = [
    {
        id: 'cod',
        title: 'Cash on Delivery',
        description: 'Pay with cash when your order is delivered',
        enabled: true,
        icon: 'cash'
    },
    {
        id: 'bacs',
        title: 'Direct Bank Transfer',
        description: 'Make payment directly into our bank account',
        enabled: true,
        icon: 'bank',
        instructions: 'Please use your Order ID as the payment reference.'
    },
    {
        id: 'card',
        title: 'Credit/Debit Card',
        description: 'Pay securely with your credit or debit card',
        enabled: true,
        icon: 'credit-card',
        supportedCards: ['visa', 'mastercard', 'amex']
    },
    {
        id: 'paypal',
        title: 'PayPal',
        description: 'Pay via PayPal; you can pay with your credit card if you don\'t have a PayPal account',
        enabled: true,
        icon: 'paypal'
    },
    {
        id: 'stripe',
        title: 'Stripe',
        description: 'Pay securely using Stripe payment gateway',
        enabled: true,
        icon: 'stripe',
        supportedCards: ['visa', 'mastercard', 'amex', 'discover']
    },
    {
        id: 'wallet',
        title: 'Digital Wallet',
        description: 'Pay using Apple Pay, Google Pay, or other digital wallets',
        enabled: true,
        icon: 'wallet',
        supportedWallets: ['apple_pay', 'google_pay']
    }
];

// @route   GET /wc/v3/payment/methods
// @desc    Get available payment methods
// @access  Public
router.get('/wc/v3/payment/methods', (req, res) => {
    const availableMethods = paymentMethods.filter(method => method.enabled);
    res.status(200).json(availableMethods);
});

// @route   GET /wc/v3/payment/methods/:id
// @desc    Get single payment method details
// @access  Public
router.get('/wc/v3/payment/methods/:id', (req, res) => {
    const method = paymentMethods.find(m => m.id === req.params.id);

    if (!method) {
        return res.status(404).json({
            code: 'payment_method_not_found',
            message: 'Payment method not found',
            data: { status: 404 }
        });
    }

    res.status(200).json(method);
});

// @route   POST /wc/v3/payment/process
// @desc    Process payment (mock endpoint)
// @access  Private
router.post('/wc/v3/payment/process', protect, async (req, res, next) => {
    try {
        const { orderId, paymentMethodId, paymentDetails } = req.body;

        if (!orderId || !paymentMethodId) {
            return res.status(400).json({
                code: 'missing_required_fields',
                message: 'Order ID and payment method are required',
                data: { status: 400 }
            });
        }

        const method = paymentMethods.find(m => m.id === paymentMethodId);

        if (!method || !method.enabled) {
            return res.status(400).json({
                code: 'invalid_payment_method',
                message: 'Invalid or disabled payment method',
                data: { status: 400 }
            });
        }

        // In production, integrate with actual payment gateways
        // For now, simulate payment processing

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate 95% success rate
        const isSuccess = Math.random() > 0.05;

        if (isSuccess) {
            // In production, update order status in database
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            res.status(200).json({
                success: true,
                message: 'Payment processed successfully',
                transactionId,
                paymentMethod: method.title,
                status: 'completed'
            });
        } else {
            res.status(400).json({
                success: false,
                code: 'payment_failed',
                message: 'Payment processing failed. Please try again.',
                data: { status: 400 }
            });
        }
    } catch (error) {
        next(error);
    }
});

// @route   POST /wc/v3/payment/validate-card
// @desc    Validate card details (mock endpoint)
// @access  Private
router.post('/wc/v3/payment/validate-card', protect, (req, res) => {
    const { cardNumber, expiryMonth, expiryYear, cvv } = req.body;

    // Basic validation
    const errors = [];

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        errors.push('Invalid card number');
    }

    if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) {
        errors.push('Invalid expiry month');
    }

    const currentYear = new Date().getFullYear();
    if (!expiryYear || expiryYear < currentYear) {
        errors.push('Card has expired');
    }

    if (!cvv || cvv.length < 3) {
        errors.push('Invalid CVV');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            code: 'invalid_card_details',
            message: errors.join(', '),
            data: { status: 400, errors }
        });
    }

    // Detect card type
    const cardNum = cardNumber.replace(/\s/g, '');
    let cardType = 'unknown';

    if (/^4/.test(cardNum)) cardType = 'visa';
    else if (/^5[1-5]/.test(cardNum)) cardType = 'mastercard';
    else if (/^3[47]/.test(cardNum)) cardType = 'amex';
    else if (/^6(?:011|5)/.test(cardNum)) cardType = 'discover';

    res.status(200).json({
        valid: true,
        cardType,
        last4: cardNum.slice(-4)
    });
});

// @route   GET /wc/v3/payment/gateways
// @desc    Get payment gateway configuration
// @access  Private/Admin
router.get('/wc/v3/payment/gateways', protect, (req, res) => {
    const gateways = [
        {
            id: 'stripe',
            name: 'Stripe',
            status: 'active',
            testMode: process.env.NODE_ENV === 'development',
            supportedCountries: ['US', 'CA', 'GB', 'EU']
        },
        {
            id: 'paypal',
            name: 'PayPal',
            status: 'active',
            testMode: process.env.NODE_ENV === 'development',
            supportedCountries: ['*']
        }
    ];

    res.status(200).json(gateways);
});

module.exports = router;