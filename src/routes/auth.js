const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { protect } = require('../middleware/auth');
const { checkDatabaseHealth } = require('../middleware/dbHealth');
const {
    login,
    register,
    validateToken,
    refreshToken
} = require('../controllers/authController');

// @route   POST /jwt-auth/v1/token
// @desc    Login user and get JWT token
// @access  Public
router.post(
    '/jwt-auth/v1/token',
    [
        body('username').notEmpty().withMessage('Username or email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    login
);

// @route   POST /jwt-auth/v1/validate
// @desc    Validate JWT token
// @access  Private
router.post('/jwt-auth/v1/validate', protect, validateToken);

// @route   POST /jwt-auth/v1/token/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/jwt-auth/v1/token/refresh', protect, refreshToken);

// @route   POST /tradebakerz/wc/v1/register
// @desc    Register new user account
// @access  Public
router.post(
    '/tradebakerz/wc/v1/register',
    checkDatabaseHealth, // Add database health check
    [
        body('username')
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .matches(/\d/).withMessage('Password must contain at least one number'),
        validate
    ],
    register
);

// @route   POST /tradebakerz/wc/v1/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/tradebakerz/wc/v1/auth/logout', protect, (req, res) => {
    // JWT is stateless, so logout is handled client-side by removing the token
    // This endpoint is here for consistency and can be extended with token blacklisting
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @route   GET /tradebakerz/wc/v1/auth/me
// @desc    Get current logged-in user profile
// @access  Private
router.get('/tradebakerz/wc/v1/auth/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            displayName: req.user.displayName,
            role: req.user.role,
            avatar: req.user.avatar,
            isEmailVerified: req.user.isEmailVerified,
            createdAt: req.user.createdAt
        }
    });
});

// @route   PUT /tradebakerz/wc/v1/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
    '/tradebakerz/wc/v1/auth/change-password',
    protect,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
            .matches(/\d/).withMessage('New password must contain at least one number'),
        validate
    ],
    async (req, res, next) => {
        try {
            const User = require('../models/User');
            const { currentPassword, newPassword } = req.body;

            // Get user with password field
            const user = await User.findById(req.user._id).select('+password');

            // Check current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    code: 'invalid_password',
                    message: 'Current password is incorrect',
                    data: { status: 400 }
                });
            }

            // Check if new password is same as current
            if (currentPassword === newPassword) {
                return res.status(400).json({
                    code: 'same_password',
                    message: 'New password must be different from current password',
                    data: { status: 400 }
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /tradebakerz/wc/v1/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post(
    '/tradebakerz/wc/v1/auth/forgot-password',
    [
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email'),
        validate
    ],
    async (req, res, next) => {
        try {
            const User = require('../models/User');
            const crypto = require('crypto');

            const user = await User.findOne({ email: req.body.email });

            if (!user) {
                // Don't reveal if user exists for security
                return res.status(200).json({
                    success: true,
                    message: 'If that email exists, a password reset link has been sent'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Save reset token to user (expires in 1 hour)
            user.resetPasswordToken = resetTokenHash;
            user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save();

            // In production, send email with reset link
            // For now, return the token (in production, this should be sent via email)
            const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

            // TODO: Send email with resetUrl
            console.log('Password Reset URL:', resetUrl);

            res.status(200).json({
                success: true,
                message: 'Password reset email sent',
                // Remove this in production - only for development
                resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /tradebakerz/wc/v1/auth/reset-password/:resetToken
// @desc    Reset password using reset token
// @access  Public
router.put(
    '/tradebakerz/wc/v1/auth/reset-password/:resetToken',
    [
        body('password')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .matches(/\d/).withMessage('Password must contain at least one number'),
        validate
    ],
    async (req, res, next) => {
        try {
            const User = require('../models/User');
            const crypto = require('crypto');

            // Hash the token from URL
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(req.params.resetToken)
                .digest('hex');

            // Find user with valid reset token
            const user = await User.findOne({
                resetPasswordToken: resetTokenHash,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    code: 'invalid_token',
                    message: 'Invalid or expired reset token',
                    data: { status: 400 }
                });
            }

            // Set new password
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /tradebakerz/wc/v1/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post(
    '/tradebakerz/wc/v1/auth/verify-email/:token',
    async (req, res, next) => {
        try {
            const User = require('../models/User');
            const crypto = require('crypto');

            // Hash the token
            const emailVerifyTokenHash = crypto
                .createHash('sha256')
                .update(req.params.token)
                .digest('hex');

            // Find user with valid verification token
            const user = await User.findOne({
                emailVerifyToken: emailVerifyTokenHash,
                emailVerifyExpire: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    code: 'invalid_token',
                    message: 'Invalid or expired verification token',
                    data: { status: 400 }
                });
            }

            // Mark email as verified
            user.isEmailVerified = true;
            user.emailVerifyToken = undefined;
            user.emailVerifyExpire = undefined;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /tradebakerz/wc/v1/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/tradebakerz/wc/v1/auth/resend-verification', protect, async (req, res, next) => {
    try {
        const User = require('../models/User');
        const crypto = require('crypto');

        if (req.user.isEmailVerified) {
            return res.status(400).json({
                code: 'already_verified',
                message: 'Email is already verified',
                data: { status: 400 }
            });
        }

        // Generate verification token
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');

        // Save verification token
        const user = await User.findById(req.user._id);
        user.emailVerifyToken = verifyTokenHash;
        user.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // TODO: Send verification email
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify-email/${verifyToken}`;
        console.log('Email Verification URL:', verifyUrl);

        res.status(200).json({
            success: true,
            message: 'Verification email sent',
            // Remove this in production
            verifyToken: process.env.NODE_ENV === 'development' ? verifyToken : undefined
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;