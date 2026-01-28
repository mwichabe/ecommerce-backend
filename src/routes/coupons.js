const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect, authorize } = require('../middleware/auth');

// Coupon Model (simple in-memory for now - should be in database)
let coupons = [
    {
        id: '1',
        code: 'WELCOME10',
        type: 'percent',
        amount: 10,
        description: '10% off for new customers',
        minimumAmount: 0,
        maximumAmount: null,
        usageLimit: null,
        usageCount: 0,
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date()
    },
    {
        id: '2',
        code: 'SAVE20',
        type: 'fixed',
        amount: 20,
        description: '$20 off orders over $100',
        minimumAmount: 100,
        maximumAmount: null,
        usageLimit: 100,
        usageCount: 0,
        expiryDate: new Date('2026-06-30'),
        isActive: true,
        createdAt: new Date()
    },
    {
        id: '3',
        code: 'FREESHIP',
        type: 'free_shipping',
        amount: 0,
        description: 'Free shipping on all orders',
        minimumAmount: 50,
        maximumAmount: null,
        usageLimit: null,
        usageCount: 0,
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date()
    }
];

// @route   GET /wc/v3/coupons
// @desc    Get all coupons
// @access  Private/Admin
router.get('/wc/v3/coupons', protect, authorize('admin'), (req, res) => {
    const {
        page = 1,
        per_page = 10,
        search,
        status
    } = req.query;

    let filteredCoupons = [...coupons];

    if (search) {
        filteredCoupons = filteredCoupons.filter(coupon =>
            coupon.code.toLowerCase().includes(search.toLowerCase()) ||
            coupon.description.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (status === 'active') {
        filteredCoupons = filteredCoupons.filter(c => c.isActive);
    } else if (status === 'inactive') {
        filteredCoupons = filteredCoupons.filter(c => !c.isActive);
    }

    const limit = Math.min(parseInt(per_page), 100);
    const skip = (parseInt(page) - 1) * limit;
    const paginatedCoupons = filteredCoupons.slice(skip, skip + limit);

    res.set({
        'X-WP-Total': filteredCoupons.length,
        'X-WP-TotalPages': Math.ceil(filteredCoupons.length / limit)
    });

    res.status(200).json(paginatedCoupons);
});

// @route   GET /wc/v3/coupons/:id
// @desc    Get single coupon
// @access  Private/Admin
router.get('/wc/v3/coupons/:id', protect, authorize('admin'), (req, res) => {
    const coupon = coupons.find(c => c.id === req.params.id);

    if (!coupon) {
        return res.status(404).json({
            code: 'coupon_not_found',
            message: 'Coupon not found',
            data: { status: 404 }
        });
    }

    res.status(200).json(coupon);
});

// @route   POST /wc/v3/coupons
// @desc    Create new coupon
// @access  Private/Admin
router.post(
    '/wc/v3/coupons',
    protect,
    authorize('admin'),
    [
        body('code').notEmpty().withMessage('Coupon code is required')
            .isLength({ min: 3, max: 50 }).withMessage('Code must be 3-50 characters')
            .matches(/^[A-Z0-9]+$/).withMessage('Code must be uppercase letters and numbers only'),
        body('type').isIn(['percent', 'fixed', 'free_shipping']).withMessage('Invalid coupon type'),
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        validate
    ],
    (req, res) => {
        const { code, type, amount, description, minimumAmount, maximumAmount, usageLimit, expiryDate } = req.body;

        // Check if code already exists
        if (coupons.find(c => c.code === code)) {
            return res.status(400).json({
                code: 'coupon_exists',
                message: 'Coupon code already exists',
                data: { status: 400 }
            });
        }

        const newCoupon = {
            id: (coupons.length + 1).toString(),
            code,
            type,
            amount: parseFloat(amount),
            description: description || '',
            minimumAmount: minimumAmount ? parseFloat(minimumAmount) : 0,
            maximumAmount: maximumAmount ? parseFloat(maximumAmount) : null,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            usageCount: 0,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            isActive: true,
            createdAt: new Date()
        };

        coupons.push(newCoupon);

        res.status(201).json(newCoupon);
    }
);

// @route   PUT /wc/v3/coupons/:id
// @desc    Update coupon
// @access  Private/Admin
router.put('/wc/v3/coupons/:id', protect, authorize('admin'), (req, res) => {
    const couponIndex = coupons.findIndex(c => c.id === req.params.id);

    if (couponIndex === -1) {
        return res.status(404).json({
            code: 'coupon_not_found',
            message: 'Coupon not found',
            data: { status: 404 }
        });
    }

    const updatedCoupon = {
        ...coupons[couponIndex],
        ...req.body,
        id: req.params.id, // Prevent ID change
        createdAt: coupons[couponIndex].createdAt // Prevent createdAt change
    };

    coupons[couponIndex] = updatedCoupon;

    res.status(200).json(updatedCoupon);
});

// @route   DELETE /wc/v3/coupons/:id
// @desc    Delete coupon
// @access  Private/Admin
router.delete('/wc/v3/coupons/:id', protect, authorize('admin'), (req, res) => {
    const couponIndex = coupons.findIndex(c => c.id === req.params.id);

    if (couponIndex === -1) {
        return res.status(404).json({
            code: 'coupon_not_found',
            message: 'Coupon not found',
            data: { status: 404 }
        });
    }

    coupons.splice(couponIndex, 1);

    res.status(200).json({
        id: req.params.id,
        deleted: true
    });
});

// @route   POST /wc/v3/coupons/validate
// @desc    Validate and apply coupon to cart
// @access  Private
router.post(
    '/wc/v3/coupons/validate',
    protect,
    [
        body('code').notEmpty().withMessage('Coupon code is required'),
        body('cartTotal').isFloat({ min: 0 }).withMessage('Cart total is required'),
        validate
    ],
    (req, res) => {
        const { code, cartTotal } = req.body;

        const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());

        if (!coupon) {
            return res.status(404).json({
                code: 'coupon_not_found',
                message: 'Invalid coupon code',
                data: { status: 404 }
            });
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return res.status(400).json({
                code: 'coupon_inactive',
                message: 'This coupon is no longer active',
                data: { status: 400 }
            });
        }

        // Check expiry
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({
                code: 'coupon_expired',
                message: 'This coupon has expired',
                data: { status: 400 }
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({
                code: 'coupon_limit_reached',
                message: 'This coupon has reached its usage limit',
                data: { status: 400 }
            });
        }

        // Check minimum amount
        if (coupon.minimumAmount && parseFloat(cartTotal) < coupon.minimumAmount) {
            return res.status(400).json({
                code: 'minimum_amount_not_met',
                message: `Minimum order amount of $${coupon.minimumAmount} required`,
                data: { status: 400 }
            });
        }

        // Check maximum amount
        if (coupon.maximumAmount && parseFloat(cartTotal) > coupon.maximumAmount) {
            return res.status(400).json({
                code: 'maximum_amount_exceeded',
                message: `This coupon is only valid for orders up to $${coupon.maximumAmount}`,
                data: { status: 400 }
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percent') {
            discount = (parseFloat(cartTotal) * coupon.amount) / 100;
        } else if (coupon.type === 'fixed') {
            discount = coupon.amount;
        }

        res.status(200).json({
            valid: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                description: coupon.description
            },
            discount: discount.toFixed(2),
            freeShipping: coupon.type === 'free_shipping'
        });
    }
);

// @route   POST /wc/v3/coupons/:id/apply
// @desc    Apply coupon (increment usage count)
// @access  Private
router.post('/wc/v3/coupons/:id/apply', protect, (req, res) => {
    const coupon = coupons.find(c => c.id === req.params.id);

    if (!coupon) {
        return res.status(404).json({
            code: 'coupon_not_found',
            message: 'Coupon not found',
            data: { status: 404 }
        });
    }

    coupon.usageCount += 1;

    res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        usageCount: coupon.usageCount
    });
});

module.exports = router;