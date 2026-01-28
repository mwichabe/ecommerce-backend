const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Verify JWT token and protect routes
const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            code: 'unauthorized',
            message: 'Not authorized to access this route',
            data: { status: 401 }
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                code: 'user_not_found',
                message: 'User not found',
                data: { status: 401 }
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                code: 'account_disabled',
                message: 'Account has been disabled',
                data: { status: 401 }
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            code: 'invalid_token',
            message: 'Invalid or expired token',
            data: { status: 401 }
        });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 'forbidden',
                message: `User role '${req.user.role}' is not authorized to access this route`,
                data: { status: 403 }
            });
        }
        next();
    };
};

module.exports = {
    generateToken,
    protect,
    authorize
};