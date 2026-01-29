// Database health check middleware
const mongoose = require('mongoose');

// Middleware to check database connection before processing requests
const checkDatabaseHealth = (req, res, next) => {
    const connectionState = mongoose.connection.readyState;

    switch (connectionState) {
        case 0: // disconnected
            console.error('Database is disconnected, cannot process request');
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable',
                code: 'DB_DISCONNECTED',
                retryAfter: 30
            });

        case 1: // connected
            // Database is connected, proceed
            next();
            break;

        case 2: // connecting
            console.log('Database is connecting, waiting...');
            // Wait a bit and check again
            setTimeout(() => {
                if (mongoose.connection.readyState === 1) {
                    next();
                } else {
                    res.status(503).json({
                        success: false,
                        message: 'Database still connecting',
                        code: 'DB_CONNECTING',
                        retryAfter: 15
                    });
                }
            }, 2000);
            break;

        case 3: // disconnecting
            console.error('Database is disconnecting');
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable',
                code: 'DB_DISCONNECTING',
                retryAfter: 30
            });

        default:
            console.error('Unknown database state:', connectionState);
            return res.status(500).json({
                success: false,
                message: 'Database connection error',
                code: 'DB_UNKNOWN_STATE'
            });
    }
};

// Get database health status
const getDatabaseHealth = () => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    return {
        state: states[state] || 'unknown',
        readyState: state,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        healthy: state === 1
    };
};

module.exports = {
    checkDatabaseHealth,
    getDatabaseHealth
};
