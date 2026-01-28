const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Simple in-memory shipping methods (in production, this would be in database)
const shippingMethods = [
    {
        id: 'flat_rate',
        title: 'Flat Rate',
        cost: '10.00',
        description: 'Standard shipping - 5-7 business days',
        enabled: true
    },
    {
        id: 'free_shipping',
        title: 'Free Shipping',
        cost: '0.00',
        description: 'Free standard shipping - 7-10 business days',
        enabled: true,
        minOrderAmount: 100
    },
    {
        id: 'express',
        title: 'Express Shipping',
        cost: '25.00',
        description: 'Express delivery - 2-3 business days',
        enabled: true
    },
    {
        id: 'overnight',
        title: 'Overnight Shipping',
        cost: '50.00',
        description: 'Next business day delivery',
        enabled: true
    }
];

// @route   GET /wc/v3/shipping/methods
// @desc    Get available shipping methods
// @access  Public
router.get('/wc/v3/shipping/methods', (req, res) => {
    const { cartTotal } = req.query;

    let availableMethods = shippingMethods.filter(method => method.enabled);

    // Filter based on minimum order amount
    if (cartTotal) {
        availableMethods = availableMethods.filter(method => {
            if (method.minOrderAmount) {
                return parseFloat(cartTotal) >= method.minOrderAmount;
            }
            return true;
        });
    }

    res.status(200).json(availableMethods);
});

// @route   GET /wc/v3/shipping/methods/:id
// @desc    Get single shipping method
// @access  Public
router.get('/wc/v3/shipping/methods/:id', (req, res) => {
    const method = shippingMethods.find(m => m.id === req.params.id);

    if (!method) {
        return res.status(404).json({
            code: 'shipping_method_not_found',
            message: 'Shipping method not found',
            data: { status: 404 }
        });
    }

    res.status(200).json(method);
});

// @route   POST /wc/v3/shipping/calculate
// @desc    Calculate shipping cost
// @access  Public
router.post('/wc/v3/shipping/calculate', (req, res) => {
    const { methodId, destination, items } = req.body;

    const method = shippingMethods.find(m => m.id === methodId);

    if (!method) {
        return res.status(404).json({
            code: 'shipping_method_not_found',
            message: 'Shipping method not found',
            data: { status: 404 }
        });
    }

    // In production, calculate based on weight, distance, etc.
    let cost = parseFloat(method.cost);

    // Example: Add $1 per item for express/overnight
    if (methodId === 'express' || methodId === 'overnight') {
        const itemCount = items?.length || 0;
        cost += itemCount * 1;
    }

    res.status(200).json({
        method: method.title,
        cost: cost.toFixed(2),
        estimatedDays: methodId === 'overnight' ? 1 :
            methodId === 'express' ? 3 :
                methodId === 'free_shipping' ? 9 : 6
    });
});

// @route   GET /wc/v3/shipping/zones
// @desc    Get shipping zones
// @access  Public
router.get('/wc/v3/shipping/zones', (req, res) => {
    // Simple zone configuration
    const zones = [
        {
            id: 1,
            name: 'United States',
            regions: ['US'],
            methods: shippingMethods.filter(m => m.enabled)
        },
        {
            id: 2,
            name: 'International',
            regions: ['*'],
            methods: shippingMethods.filter(m => m.id !== 'overnight')
        }
    ];

    res.status(200).json(zones);
});

module.exports = router;