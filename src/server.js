require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error');

// Import routes - Using modular route structure
const {
    authRoutes,
    productRoutes,
    categoryRoutes,
    cartRoutes,
    orderRoutes,
    customerRoutes,
    wishlistRoutes,
    reviewRoutes,
    searchRoutes,
    tagRoutes,
    adminRoutes,
    shippingRoutes,
    paymentRoutes,
    couponRoutes,
    settingsRoutes
} = require('./routes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        code: 'too_many_requests',
        message: 'Too many requests from this IP, please try again later',
        data: { status: 429 }
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/wp-json', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API routes - Modular structure
app.use('/wp-json', authRoutes);
app.use('/wp-json', productRoutes);
app.use('/wp-json', categoryRoutes);
app.use('/wp-json', cartRoutes);
app.use('/wp-json', orderRoutes);
app.use('/wp-json', customerRoutes);
app.use('/wp-json', wishlistRoutes);
app.use('/wp-json', reviewRoutes);
app.use('/wp-json', searchRoutes);
app.use('/wp-json', tagRoutes);
app.use('/wp-json', adminRoutes);
app.use('/wp-json', shippingRoutes);
app.use('/wp-json', paymentRoutes);
app.use('/wp-json', couponRoutes);
app.use('/wp-json', settingsRoutes);

// API info route at /wp-json
app.get('/wp-json', (req, res) => {
    res.json({
        message: 'E-Commerce API - Complete Backend Solution',
        version: '1.0.0',
        status: 'online',
        documentation: 'See ROUTES.md for complete API documentation',
        base_url: `${req.protocol}://${req.get('host')}/wp-json`,
        endpoints: {
            authentication: {
                login: 'POST /wp-json/jwt-auth/v1/token',
                register: 'POST /wp-json/tradebakerz/wc/v1/register',
                validate: 'POST /wp-json/jwt-auth/v1/validate [Auth]',
                refresh: 'POST /wp-json/jwt-auth/v1/token/refresh [Auth]',
                logout: 'POST /wp-json/tradebakerz/wc/v1/auth/logout [Auth]',
                me: 'GET /wp-json/tradebakerz/wc/v1/auth/me [Auth]',
                changePassword: 'PUT /wp-json/tradebakerz/wc/v1/auth/change-password [Auth]',
                forgotPassword: 'POST /wp-json/tradebakerz/wc/v1/auth/forgot-password',
                resetPassword: 'PUT /wp-json/tradebakerz/wc/v1/auth/reset-password/:token',
                verifyEmail: 'POST /wp-json/tradebakerz/wc/v1/auth/verify-email/:token',
                resendVerification: 'POST /wp-json/tradebakerz/wc/v1/auth/resend-verification [Auth]'
            },
            products: {
                list: 'GET /wp-json/wc/v3/products',
                single: 'GET /wp-json/wc/v3/products/:id',
                create: 'POST /wp-json/wc/v3/products [Admin]',
                update: 'PUT /wp-json/wc/v3/products/:id [Admin]',
                delete: 'DELETE /wp-json/wc/v3/products/:id [Admin]'
            },
            categories: {
                list: 'GET /wp-json/wc/v3/products/categories',
                single: 'GET /wp-json/wc/v3/products/categories/:id',
                create: 'POST /wp-json/wc/v3/products/categories [Admin]',
                update: 'PUT /wp-json/wc/v3/products/categories/:id [Admin]',
                delete: 'DELETE /wp-json/wc/v3/products/categories/:id [Admin]'
            },
            cart: {
                get: 'GET /wp-json/wc/v3/cart [Auth]',
                add: 'POST /wp-json/wc/v3/cart/add [Auth]',
                update: 'POST /wp-json/wc/v3/cart/update-item [Auth]',
                remove: 'POST /wp-json/wc/v3/cart/remove-item [Auth]',
                clear: 'POST /wp-json/wc/v3/cart/clear [Auth]'
            },
            orders: {
                create: 'POST /wp-json/wc/v3/orders [Auth]',
                list: 'GET /wp-json/wc/v3/orders [Auth]',
                single: 'GET /wp-json/wc/v3/orders/:id [Auth]',
                update: 'PUT /wp-json/wc/v3/orders/:id [Admin]',
                delete: 'DELETE /wp-json/wc/v3/orders/:id [Admin]'
            },
            customers: {
                get: 'GET /wp-json/wc/v3/customers/:id [Auth]',
                update: 'PUT /wp-json/wc/v3/customers/:id [Auth]'
            },
            wishlist: {
                get: 'GET /wp-json/tradebakerz/wc/v1/wishlist [Auth]',
                add: 'POST /wp-json/tradebakerz/wc/v1/wishlist/add [Auth]',
                remove: 'DELETE /wp-json/tradebakerz/wc/v1/wishlist/:product_id [Auth]'
            },
            reviews: {
                list: 'GET /wp-json/wc/v3/products/reviews',
                create: 'POST /wp-json/wc/v3/products/reviews [Auth]'
            },
            search: {
                global: 'GET /wp-json/tradebakerz/wc/v1/search'
            },
            settings: {
                get: 'GET /wp-json/tradebakerz/wc/v1/settings [Auth]',
                update: 'PUT /wp-json/tradebakerz/wc/v1/settings [Auth]',
                notifications: 'GET /wp-json/tradebakerz/wc/v1/notifications [Auth]',
                addresses: 'GET /wp-json/tradebakerz/wc/v1/addresses [Auth]',
                addAddress: 'POST /wp-json/tradebakerz/wc/v1/addresses [Auth]'
            },
            admin: {
                dashboard: 'GET /wp-json/tradebakerz/wc/v1/admin/dashboard [Admin]',
                users: 'GET /wp-json/tradebakerz/wc/v1/admin/users [Admin]',
                salesReport: 'GET /wp-json/tradebakerz/wc/v1/admin/reports/sales [Admin]',
                productsReport: 'GET /wp-json/tradebakerz/wc/v1/admin/reports/products [Admin]'
            }
        },
        stats: {
            totalEndpoints: '50+',
            routeModules: 15,
            features: [
                'JWT Authentication',
                'Password Reset',
                'Email Verification',
                'Product Management',
                'Cart & Checkout',
                'Order Processing',
                'Wishlist',
                'Reviews & Ratings',
                'Coupons & Discounts',
                'Admin Dashboard',
                'User Settings',
                'Notifications'
            ]
        }
    });
});

// Welcome route at root
app.get('/', (req, res) => {
    res.json({
        message: 'E-Commerce API - Complete Backend Solution',
        version: '1.0.0',
        status: 'online',
        documentation: 'See ROUTES.md for complete API documentation',
        endpoints: {
            authentication: {
                login: 'POST /jwt-auth/v1/token',
                register: 'POST /tradebakerz/wc/v1/register',
                validate: 'POST /jwt-auth/v1/validate [Auth]',
                refresh: 'POST /jwt-auth/v1/token/refresh [Auth]',
                logout: 'POST /tradebakerz/wc/v1/auth/logout [Auth]',
                me: 'GET /tradebakerz/wc/v1/auth/me [Auth]',
                changePassword: 'PUT /tradebakerz/wc/v1/auth/change-password [Auth]',
                forgotPassword: 'POST /tradebakerz/wc/v1/auth/forgot-password',
                resetPassword: 'PUT /tradebakerz/wc/v1/auth/reset-password/:token',
                verifyEmail: 'POST /tradebakerz/wc/v1/auth/verify-email/:token',
                resendVerification: 'POST /tradebakerz/wc/v1/auth/resend-verification [Auth]'
            },
            products: {
                list: 'GET /wc/v3/products',
                single: 'GET /wc/v3/products/:id',
                create: 'POST /wc/v3/products [Admin]',
                update: 'PUT /wc/v3/products/:id [Admin]',
                delete: 'DELETE /wc/v3/products/:id [Admin]'
            },
            categories: {
                list: 'GET /wc/v3/products/categories',
                single: 'GET /wc/v3/products/categories/:id',
                create: 'POST /wc/v3/products/categories [Admin]',
                update: 'PUT /wc/v3/products/categories/:id [Admin]',
                delete: 'DELETE /wc/v3/products/categories/:id [Admin]'
            },
            tags: {
                list: 'GET /wc/v3/products/tags',
                single: 'GET /wc/v3/products/tags/:id',
                create: 'POST /wc/v3/products/tags [Admin]',
                update: 'PUT /wc/v3/products/tags/:id [Admin]',
                delete: 'DELETE /wc/v3/products/tags/:id [Admin]'
            },
            cart: {
                get: 'GET /wc/v3/cart [Auth]',
                add: 'POST /wc/v3/cart/add [Auth]',
                update: 'POST /wc/v3/cart/update-item [Auth]',
                remove: 'POST /wc/v3/cart/remove-item [Auth]',
                clear: 'POST /wc/v3/cart/clear [Auth]'
            },
            orders: {
                create: 'POST /wc/v3/orders [Auth]',
                list: 'GET /wc/v3/orders [Auth]',
                single: 'GET /wc/v3/orders/:id [Auth]',
                update: 'PUT /wc/v3/orders/:id [Admin]',
                delete: 'DELETE /wc/v3/orders/:id [Admin]'
            },
            customers: {
                get: 'GET /wc/v3/customers/:id [Auth]',
                update: 'PUT /wc/v3/customers/:id [Auth]'
            },
            wishlist: {
                get: 'GET /tradebakerz/wc/v1/wishlist [Auth]',
                add: 'POST /tradebakerz/wc/v1/wishlist/add [Auth]',
                remove: 'DELETE /tradebakerz/wc/v1/wishlist/:product_id [Auth]'
            },
            reviews: {
                list: 'GET /wc/v3/products/reviews',
                create: 'POST /wc/v3/products/reviews [Auth]'
            },
            search: {
                global: 'GET /tradebakerz/wc/v1/search'
            },
            shipping: {
                methods: 'GET /wc/v3/shipping/methods',
                calculate: 'POST /wc/v3/shipping/calculate',
                zones: 'GET /wc/v3/shipping/zones'
            },
            payment: {
                methods: 'GET /wc/v3/payment/methods',
                process: 'POST /wc/v3/payment/process [Auth]',
                validateCard: 'POST /wc/v3/payment/validate-card [Auth]',
                gateways: 'GET /wc/v3/payment/gateways [Auth]'
            },
            coupons: {
                list: 'GET /wc/v3/coupons [Admin]',
                single: 'GET /wc/v3/coupons/:id [Admin]',
                create: 'POST /wc/v3/coupons [Admin]',
                update: 'PUT /wc/v3/coupons/:id [Admin]',
                delete: 'DELETE /wc/v3/coupons/:id [Admin]',
                validate: 'POST /wc/v3/coupons/validate [Auth]',
                apply: 'POST /wc/v3/coupons/:id/apply [Auth]'
            },
            settings: {
                get: 'GET /tradebakerz/wc/v1/settings [Auth]',
                update: 'PUT /tradebakerz/wc/v1/settings [Auth]',
                notifications: 'GET /tradebakerz/wc/v1/notifications [Auth]',
                markRead: 'PATCH /tradebakerz/wc/v1/notifications/:id/read [Auth]',
                markAllRead: 'PATCH /tradebakerz/wc/v1/notifications/read-all [Auth]',
                addresses: 'GET /tradebakerz/wc/v1/addresses [Auth]',
                addAddress: 'POST /tradebakerz/wc/v1/addresses [Auth]'
            },
            admin: {
                dashboard: 'GET /tradebakerz/wc/v1/admin/dashboard [Admin]',
                users: 'GET /tradebakerz/wc/v1/admin/users [Admin]',
                updateUserRole: 'PATCH /tradebakerz/wc/v1/admin/users/:id/role [Admin]',
                updateUserStatus: 'PATCH /tradebakerz/wc/v1/admin/users/:id/status [Admin]',
                salesReport: 'GET /tradebakerz/wc/v1/admin/reports/sales [Admin]',
                productsReport: 'GET /tradebakerz/wc/v1/admin/reports/products [Admin]'
            }
        },
        stats: {
            totalEndpoints: '70+',
            routeModules: 15,
            features: [
                'JWT Authentication',
                'Password Reset',
                'Email Verification',
                'Product Management',
                'Cart & Checkout',
                'Order Processing',
                'Wishlist',
                'Reviews & Ratings',
                'Coupons & Discounts',
                'Shipping Methods',
                'Payment Processing',
                'Admin Dashboard',
                'User Settings',
                'Notifications'
            ]
        }
    });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 9211;

const server = app.listen(PORT, () => {
    console.log(`

                                                          
   E-Commerce API Server                                  
                                                          
   Server running in ${process.env.NODE_ENV || 'development'} mode                        ║
   Port: ${PORT}                                          
   Base URL: http://localhost:${PORT}/wp-json             
                                                          
   Documentation: http://localhost:${PORT}          
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app;