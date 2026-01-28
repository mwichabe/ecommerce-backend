const { validationResult } = require('express-validator');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            code: 'resource_not_found',
            message,
            data: { status: 404 }
        };
        return res.status(404).json(error);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = {
            code: `${field}_exists`,
            message,
            data: { status: 400 }
        };
        return res.status(400).json(error);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            code: 'validation_error',
            message,
            data: { status: 400 }
        };
        return res.status(400).json(error);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            code: 'invalid_token',
            message: 'Invalid token',
            data: { status: 401 }
        };
        return res.status(401).json(error);
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            code: 'token_expired',
            message: 'Token expired',
            data: { status: 401 }
        };
        return res.status(401).json(error);
    }

    res.status(error.statusCode || 500).json({
        code: error.code || 'server_error',
        message: error.message || 'Server Error',
        data: {
            status: error.statusCode || 500
        }
    });
};

// Validate request
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            code: 'validation_error',
            message: errors.array()[0].msg,
            data: {
                status: 400,
                errors: errors.array()
            }
        });
    }
    next();
};

// Not found middleware
const notFound = (req, res, next) => {
    res.status(404).json({
        code: 'not_found',
        message: `Route ${req.originalUrl} not found`,
        data: { status: 404 }
    });
};

module.exports = {
    errorHandler,
    validate,
    notFound
};