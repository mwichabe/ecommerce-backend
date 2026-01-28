const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect } = require('../middleware/auth');

// @route   GET /tradebakerz/wc/v1/settings
// @desc    Get user settings and preferences
// @access  Private
router.get('/tradebakerz/wc/v1/settings', protect, async (req, res, next) => {
    try {
        // In production, fetch from settings table
        const settings = {
            notifications: {
                email: {
                    orderUpdates: true,
                    promotions: true,
                    newsletter: false,
                    productRecommendations: true
                },
                push: {
                    orderUpdates: true,
                    promotions: false,
                    newArrivals: true,
                    priceDrops: true
                },
                sms: {
                    orderUpdates: false,
                    deliveryUpdates: false
                }
            },
            privacy: {
                showProfile: true,
                showPurchaseHistory: false,
                allowDataCollection: true
            },
            preferences: {
                language: 'en',
                currency: 'USD',
                theme: 'light',
                itemsPerPage: 20
            }
        };

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /tradebakerz/wc/v1/settings
// @desc    Update user settings
// @access  Private
router.put('/tradebakerz/wc/v1/settings', protect, async (req, res, next) => {
    try {
        const { notifications, privacy, preferences } = req.body;

        // In production, save to database
        // For now, just return updated settings
        const updatedSettings = {
            notifications: notifications || {},
            privacy: privacy || {},
            preferences: preferences || {}
        };

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings: updatedSettings
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /tradebakerz/wc/v1/notifications
// @desc    Get user notifications
// @access  Private
router.get('/tradebakerz/wc/v1/notifications', protect, async (req, res, next) => {
    try {
        const { page = 1, per_page = 20, unread } = req.query;

        // Mock notifications (in production, fetch from database)
        const allNotifications = [
            {
                id: '1',
                type: 'order',
                title: 'Order Shipped',
                message: 'Your order #12345 has been shipped',
                read: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                data: { orderId: '12345' }
            },
            {
                id: '2',
                type: 'promotion',
                title: 'Special Offer',
                message: '20% off on all electronics. Use code TECH20',
                read: false,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
                data: { couponCode: 'TECH20' }
            },
            {
                id: '3',
                type: 'wishlist',
                title: 'Price Drop Alert',
                message: 'iPhone 15 Pro is now 10% off!',
                read: true,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                data: { productId: 'abc123' }
            }
        ];

        let notifications = [...allNotifications];

        if (unread === 'true') {
            notifications = notifications.filter(n => !n.read);
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;
        const paginatedNotifications = notifications.slice(skip, skip + limit);

        const unreadCount = allNotifications.filter(n => !n.read).length;

        res.set({
            'X-WP-Total': notifications.length,
            'X-WP-TotalPages': Math.ceil(notifications.length / limit)
        });

        res.status(200).json({
            notifications: paginatedNotifications,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /tradebakerz/wc/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/tradebakerz/wc/v1/notifications/:id/read', protect, (req, res) => {
    // In production, update in database
    res.status(200).json({
        success: true,
        message: 'Notification marked as read'
    });
});

// @route   PATCH /tradebakerz/wc/v1/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/tradebakerz/wc/v1/notifications/read-all', protect, (req, res) => {
    // In production, update all user notifications in database
    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });
});

// @route   DELETE /tradebakerz/wc/v1/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/tradebakerz/wc/v1/notifications/:id', protect, (req, res) => {
    // In production, delete from database
    res.status(200).json({
        success: true,
        message: 'Notification deleted'
    });
});

// @route   GET /tradebakerz/wc/v1/addresses
// @desc    Get user saved addresses
// @access  Private
router.get('/tradebakerz/wc/v1/addresses', protect, (req, res) => {
    const addresses = [
        {
            id: '1',
            type: 'billing',
            isDefault: true,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            address1: req.user.billing?.address1 || '',
            address2: req.user.billing?.address2 || '',
            city: req.user.billing?.city || '',
            state: req.user.billing?.state || '',
            postcode: req.user.billing?.postcode || '',
            country: req.user.billing?.country || '',
            phone: req.user.billing?.phone || ''
        },
        {
            id: '2',
            type: 'shipping',
            isDefault: true,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            address1: req.user.shipping?.address1 || '',
            address2: req.user.shipping?.address2 || '',
            city: req.user.shipping?.city || '',
            state: req.user.shipping?.state || '',
            postcode: req.user.shipping?.postcode || '',
            country: req.user.shipping?.country || ''
        }
    ];

    res.status(200).json({
        success: true,
        addresses
    });
});

// @route   POST /tradebakerz/wc/v1/addresses
// @desc    Add new address
// @access  Private
router.post(
    '/tradebakerz/wc/v1/addresses',
    protect,
    [
        body('type').isIn(['billing', 'shipping']).withMessage('Type must be billing or shipping'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('address1').notEmpty().withMessage('Address is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('state').notEmpty().withMessage('State is required'),
        body('postcode').notEmpty().withMessage('Postcode is required'),
        body('country').notEmpty().withMessage('Country is required'),
        validate
    ],
    (req, res) => {
        // In production, save to database
        const newAddress = {
            id: Date.now().toString(),
            ...req.body,
            isDefault: false
        };

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            address: newAddress
        });
    }
);

// @route   PUT /tradebakerz/wc/v1/addresses/:id
// @desc    Update address
// @access  Private
router.put('/tradebakerz/wc/v1/addresses/:id', protect, (req, res) => {
    // In production, update in database
    res.status(200).json({
        success: true,
        message: 'Address updated successfully'
    });
});

// @route   DELETE /tradebakerz/wc/v1/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/tradebakerz/wc/v1/addresses/:id', protect, (req, res) => {
    // In production, delete from database
    res.status(200).json({
        success: true,
        message: 'Address deleted successfully'
    });
});

module.exports = router;