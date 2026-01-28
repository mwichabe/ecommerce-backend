const User = require('../models/user');
const { generateToken } = require('../middleware/auth');

// @desc    Login user / Get JWT token
// @route   POST /wp-json/jwt-auth/v1/token
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate email & password
        if (!username || !password) {
            return res.status(400).json({
                code: 'missing_credentials',
                message: 'Please provide username/email and password',
                data: { status: 400 }
            });
        }

        // Check for user (username or email)
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).select('+password');

        if (!user) {
            return res.status(403).json({
                code: 'invalid_credentials',
                message: 'Invalid Credentials',
                data: { status: 403 }
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(403).json({
                code: 'invalid_credentials',
                message: 'Invalid Credentials',
                data: { status: 403 }
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                code: 'account_disabled',
                message: 'Account has been disabled',
                data: { status: 403 }
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create token
        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user_email: user.email,
            user_nicename: user.username,
            user_display_name: user.displayName,
            user_id: user._id,
            user_avatar: user.avatar
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register user
// @route   POST /wp-json/tradebakerz/wc/v1/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                code: 'missing_fields',
                message: 'Please provide username, email, and password',
                data: { status: 400 }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    code: 'email_exists',
                    message: 'Email already exist',
                    data: { status: 400 }
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    code: 'username_exists',
                    message: 'Username already exist',
                    data: { status: 400 }
                });
            }
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password
        });

        res.status(200).json({
            success: true,
            user_id: user._id,
            message: 'User registered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /wp-json/jwt-auth/v1/validate
// @access  Private
exports.validateToken = async (req, res, next) => {
    try {
        res.status(200).json({
            code: 'jwt_auth_valid_token',
            data: {
                status: 200
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh token
// @route   POST /wp-json/jwt-auth/v1/token/refresh
// @access  Private
exports.refreshToken = async (req, res, next) => {
    try {
        const token = generateToken(req.user._id);

        res.status(200).json({
            token,
            user_email: req.user.email,
            user_nicename: req.user.username,
            user_display_name: req.user.displayName,
            user_id: req.user._id,
            user_avatar: req.user.avatar
        });
    } catch (error) {
        next(error);
    }
};