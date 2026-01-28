const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Category = require('../models/category');

// @route   GET /tradebakerz/wc/v1/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/tradebakerz/wc/v1/admin/dashboard', protect, authorize('admin'), async (req, res, next) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalProducts = await Product.countDocuments({ status: 'publish' });
        const totalOrders = await Order.countDocuments();
        const totalCategories = await Category.countDocuments();

        // Get revenue stats
        const revenueStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totals.total' },
                    averageOrderValue: { $avg: '$totals.total' }
                }
            }
        ]);

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'username email')
            .select('orderKey status totals.total createdAt');

        // Get order status breakdown
        const orderStatusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get top selling products
        const topProducts = await Product.find({ status: 'publish' })
            .sort({ totalSales: -1 })
            .limit(5)
            .select('name totalSales price images');

        // Get low stock products
        const lowStockProducts = await Product.find({
            status: 'publish',
            manageStock: true,
            stockQuantity: { $lte: 10 }
        })
            .sort({ stockQuantity: 1 })
            .limit(10)
            .select('name stockQuantity sku');

        res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalCategories,
                totalRevenue: revenueStats[0]?.totalRevenue || 0,
                averageOrderValue: revenueStats[0]?.averageOrderValue || 0
            },
            recentOrders,
            orderStatusBreakdown,
            topProducts,
            lowStockProducts
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /tradebakerz/wc/v1/admin/users
// @desc    Get all users (admin view)
// @access  Private/Admin
router.get('/tradebakerz/wc/v1/admin/users', protect, authorize('admin'), async (req, res, next) => {
    try {
        const {
            page = 1,
            per_page = 10,
            role,
            search
        } = req.query;

        const query = {};

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await User.countDocuments(query);

        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /tradebakerz/wc/v1/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.patch('/tradebakerz/wc/v1/admin/users/:id/role', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!['customer', 'admin', 'vendor'].includes(role)) {
            return res.status(400).json({
                code: 'invalid_role',
                message: 'Invalid role. Must be customer, admin, or vendor',
                data: { status: 400 }
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                code: 'user_not_found',
                message: 'User not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /tradebakerz/wc/v1/admin/users/:id/status
// @desc    Activate or deactivate user account
// @access  Private/Admin
router.patch('/tradebakerz/wc/v1/admin/users/:id/status', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                code: 'user_not_found',
                message: 'User not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});

// @route   GET /tradebakerz/wc/v1/admin/reports/sales
// @desc    Get sales report
// @access  Private/Admin
router.get('/tradebakerz/wc/v1/admin/reports/sales', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const matchStage = {
            status: { $in: ['completed', 'processing'] }
        };

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let groupByFormat;
        switch (groupBy) {
            case 'month':
                groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            case 'week':
                groupByFormat = { $week: '$createdAt' };
                break;
            default: // day
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }

        const salesReport = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupByFormat,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totals.total' },
                    averageOrderValue: { $avg: '$totals.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            groupBy,
            data: salesReport
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /tradebakerz/wc/v1/admin/reports/products
// @desc    Get product performance report
// @access  Private/Admin
router.get('/tradebakerz/wc/v1/admin/reports/products', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { sortBy = 'sales', limit = 20 } = req.query;

        let sortField;
        switch (sortBy) {
            case 'revenue':
                // Would need to calculate from orders
                sortField = { totalSales: -1 };
                break;
            case 'views':
                // Would need view tracking
                sortField = { totalSales: -1 };
                break;
            default: // sales
                sortField = { totalSales: -1 };
        }

        const products = await Product.find({ status: 'publish' })
            .sort(sortField)
            .limit(parseInt(limit))
            .select('name sku totalSales price stockQuantity averageRating');

        res.status(200).json({
            success: true,
            sortBy,
            products
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;