// Central export point for all route modules
// This file makes it easier to import routes in the main server file

const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./category');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const customerRoutes = require('./customer');
const wishlistRoutes = require('./whishlist');
const reviewRoutes = require('./reviews');
const searchRoutes = require('./search');
const tagRoutes = require('./tags');
const adminRoutes = require('./admin');
const shippingRoutes = require('./shipping');
const paymentRoutes = require('./payment');
const couponRoutes = require('./coupons');
const settingsRoutes = require('./settings');

module.exports = {
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
};