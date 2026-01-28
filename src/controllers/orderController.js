const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const User = require('../models/user');

// @desc    Create new order
// @route   POST /wp-json/wc/v3/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
    try {
        const {
            payment_method,
            payment_method_title,
            set_paid = false,
            billing,
            shipping,
            line_items,
            shipping_lines,
            customer_note
        } = req.body;

        // Validate required fields
        if (!payment_method || !billing || !shipping || !line_items || line_items.length === 0) {
            return res.status(400).json({
                code: 'missing_required_fields',
                message: 'Missing required order fields',
                data: { status: 400 }
            });
        }

        // Build order items
        const orderItems = [];
        let subtotal = 0;

        for (const item of line_items) {
            const product = await Product.findById(item.product_id);

            if (!product) {
                return res.status(404).json({
                    code: 'product_not_found',
                    message: `Product with ID ${item.product_id} not found`,
                    data: { status: 404 }
                });
            }

            if (!product.purchasable || product.stockStatus === 'outofstock') {
                return res.status(400).json({
                    code: 'product_not_available',
                    message: `Product ${product.name} is not available`,
                    data: { status: 400 }
                });
            }

            // Check stock
            if (product.manageStock && product.stockQuantity < item.quantity) {
                return res.status(400).json({
                    code: 'insufficient_stock',
                    message: `Insufficient stock for ${product.name}`,
                    data: { status: 400 }
                });
            }

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                subtotal: itemSubtotal,
                subtotalTax: 0,
                total: itemSubtotal,
                totalTax: 0
            });

            // Update stock and sales
            if (product.manageStock) {
                product.stockQuantity -= item.quantity;
            }
            product.totalSales += item.quantity;
            await product.save();
        }

        // Calculate shipping
        let shippingTotal = 0;
        const orderShippingLines = [];

        if (shipping_lines && shipping_lines.length > 0) {
            for (const shippingLine of shipping_lines) {
                shippingTotal += parseFloat(shippingLine.total || 0);
                orderShippingLines.push({
                    methodId: shippingLine.method_id,
                    methodTitle: shippingLine.method_title,
                    total: parseFloat(shippingLine.total || 0),
                    totalTax: 0
                });
            }
        }

        // Calculate total
        const total = subtotal + shippingTotal;

        // Create order
        const order = await Order.create({
            customer: req.user._id,
            paymentMethod: payment_method,
            paymentMethodTitle: payment_method_title,
            setPaid: set_paid,
            billing,
            shipping,
            lineItems: orderItems,
            shippingLines: orderShippingLines,
            customerNote: customer_note,
            totals: {
                subtotal,
                subtotalTax: 0,
                shipping: shippingTotal,
                shippingTax: 0,
                discount: 0,
                discountTax: 0,
                total,
                totalTax: 0
            }
        });

        if (set_paid) {
            order.datePaid = new Date();
            order.addNote('Order paid via ' + payment_method_title);
            await order.save();
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { ordersCount: 1, totalSpent: total },
            isPayingCustomer: true
        });

        // Clear cart
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            await cart.clearCart();
        }

        res.status(201).json({
            id: order._id,
            order_key: order.orderKey,
            status: order.status,
            total: order.totals.total.toFixed(2),
            currency: order.currency,
            date_created: order.createdAt,
            date_modified: order.updatedAt,
            customer_id: order.customer,
            billing: order.billing,
            shipping: order.shipping,
            line_items: order.lineItems.map(item => ({
                id: item._id,
                name: item.name,
                product_id: item.product,
                quantity: item.quantity,
                subtotal: item.subtotal.toFixed(2),
                total: item.total.toFixed(2),
                price: item.price.toFixed(2)
            })),
            shipping_lines: order.shippingLines.map(line => ({
                id: line._id,
                method_title: line.methodTitle,
                total: line.total.toFixed(2)
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user orders
// @route   GET /wp-json/wc/v3/orders?customer={user_id}
// @access  Private
exports.getOrders = async (req, res, next) => {
    try {
        const {
            page = 1,
            per_page = 10,
            customer,
            status,
            orderby = 'date',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Only allow users to see their own orders unless admin
        if (req.user.role !== 'admin') {
            query.customer = req.user._id;
        } else if (customer) {
            query.customer = customer;
        }

        if (status) {
            query.status = status;
        }

        // Build sort
        let sort = {};
        if (orderby === 'date') {
            sort = { createdAt: order === 'asc' ? 1 : -1 };
        } else if (orderby === 'total') {
            sort = { 'totals.total': order === 'asc' ? 1 : -1 };
        }

        // Pagination
        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const orders = await Order.find(query)
            .populate('customer', 'id email firstName lastName')
            .sort(sort)
            .limit(limit)
            .skip(skip);

        const total = await Order.countDocuments(query);

        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(orders.map(order => ({
            id: order._id,
            order_key: order.orderKey,
            status: order.status,
            total: order.totals.total.toFixed(2),
            currency: order.currency,
            date_created: order.createdAt,
            date_modified: order.updatedAt,
            customer_id: order.customer._id,
            billing: order.billing,
            shipping: order.shipping,
            line_items: order.lineItems,
            shipping_lines: order.shippingLines
        })));
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /wp-json/wc/v3/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'id email firstName lastName')
            .populate('lineItems.product', 'id name slug images');

        if (!order) {
            return res.status(404).json({
                code: 'order_not_found',
                message: 'Order not found',
                data: { status: 404 }
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                code: 'forbidden',
                message: 'Not authorized to access this order',
                data: { status: 403 }
            });
        }

        res.status(200).json({
            id: order._id,
            order_key: order.orderKey,
            status: order.status,
            total: order.totals.total.toFixed(2),
            currency: order.currency,
            date_created: order.createdAt,
            date_modified: order.updatedAt,
            date_paid: order.datePaid,
            date_completed: order.dateCompleted,
            customer_id: order.customer._id,
            billing: order.billing,
            shipping: order.shipping,
            line_items: order.lineItems,
            shipping_lines: order.shippingLines,
            order_notes: order.orderNotes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order
// @route   PUT /wp-json/wc/v3/orders/:id
// @access  Private/Admin
exports.updateOrder = async (req, res, next) => {
    try {
        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                code: 'order_not_found',
                message: 'Order not found',
                data: { status: 404 }
            });
        }

        // Update status if provided
        if (req.body.status && req.body.status !== order.status) {
            await order.updateStatus(req.body.status, req.body.status_note);
        }

        // Update other fields
        const allowedUpdates = ['billing', 'shipping', 'customerNote'];
        allowedUpdates.forEach(field => {
            if (req.body[field]) {
                order[field] = req.body[field];
            }
        });

        await order.save();

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete order
// @route   DELETE /wp-json/wc/v3/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                code: 'order_not_found',
                message: 'Order not found',
                data: { status: 404 }
            });
        }

        await order.deleteOne();

        res.status(200).json({
            id: order._id,
            deleted: true
        });
    } catch (error) {
        next(error);
    }
};
