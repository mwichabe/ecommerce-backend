const Category = require('../models/category');
const Cart = require('../models/cart');
const Order = require('../models/order');
const User = require('../models/user');

// ============ CATEGORY CONTROLLER ============

// @desc    Get all categories
// @route   GET /wp-json/wc/v3/products/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
    try {
        const {
            page = 1,
            per_page = 10,
            search,
            parent,
            hide_empty = false
        } = req.query;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (parent !== undefined) {
            query.parent = parent === '0' || parent === '' ? null : parent;
        }

        if (hide_empty === 'true') {
            query.count = { $gt: 0 };
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const categories = await Category.find(query)
            .populate('parent', 'id name slug')
            .sort({ menuOrder: 1, name: 1 })
            .limit(limit)
            .skip(skip);

        const total = await Category.countDocuments(query);

        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category
// @route   GET /wp-json/wc/v3/products/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'id name slug');

        if (!category) {
            return res.status(404).json({
                code: 'category_not_found',
                message: 'Category not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /wp-json/wc/v3/products/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /wp-json/wc/v3/products/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                code: 'category_not_found',
                message: 'Category not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /wp-json/wc/v3/products/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                code: 'category_not_found',
                message: 'Category not found',
                data: { status: 404 }
            });
        }

        await category.deleteOne();

        res.status(200).json({
            id: category._id,
            deleted: true
        });
    } catch (error) {
        next(error);
    }
};

// ============ CART CONTROLLER ============

// @desc    Get user cart
// @route   GET /wp-json/wc/v3/cart
// @access  Private
exports.getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'id name slug price regularPrice salePrice onSale purchasable stockStatus images'
            });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        // Format response to match WooCommerce structure
        const response = {
            cart_key: cart._id,
            items: cart.items.map(item => ({
                key: item._id,
                id: item.product._id,
                quantity: item.quantity,
                name: item.product.name,
                subtotal: item.subtotal.toFixed(2),
                subtotal_tax: '0.00',
                total: item.total.toFixed(2),
                total_tax: '0.00',
                price: item.price.toFixed(2),
                image: item.product.images && item.product.images[0] ? {
                    id: item.product.images[0].id,
                    src: item.product.images[0].src,
                    name: item.product.images[0].name,
                    alt: item.product.images[0].alt
                } : null,
                product: {
                    id: item.product._id,
                    name: item.product.name,
                    slug: item.product.slug,
                    permalink: item.product.permalink,
                    price: item.product.price.toFixed(2),
                    regular_price: item.product.regularPrice.toFixed(2),
                    sale_price: item.product.salePrice ? item.product.salePrice.toFixed(2) : '',
                    on_sale: item.product.onSale,
                    purchasable: item.product.purchasable,
                    stock_status: item.product.stockStatus
                }
            })),
            shipping: {
                total: cart.totals.shipping.toFixed(2),
                total_tax: cart.totals.shippingTax.toFixed(2),
                shipping_methods: cart.shippingMethod ? [cart.shippingMethod] : []
            },
            fees: [],
            coupon_discounts: [],
            coupons: cart.coupons,
            taxes: [],
            totals: {
                subtotal: cart.totals.subtotal.toFixed(2),
                subtotal_tax: cart.totals.subtotalTax.toFixed(2),
                shipping: cart.totals.shipping.toFixed(2),
                shipping_tax: cart.totals.shippingTax.toFixed(2),
                discount: cart.totals.discount.toFixed(2),
                discount_tax: cart.totals.discountTax.toFixed(2),
                total: cart.totals.total.toFixed(2),
                total_tax: cart.totals.totalTax.toFixed(2)
            },
            removed_items: [],
            customer: {
                id: req.user._id,
                email: req.user.email,
                first_name: req.user.firstName,
                last_name: req.user.lastName,
                billing: req.user.billing,
                shipping: req.user.shipping
            }
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /wp-json/wc/v3/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
    try {
        const { id, quantity = 1, variation } = req.body;

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        await cart.addItem(id, quantity, variation);

        await cart.populate({
            path: 'items.product',
            select: 'id name slug price regularPrice salePrice onSale purchasable stockStatus'
        });

        const addedItem = cart.items[cart.items.length - 1];

        res.status(200).json({
            key: addedItem._id,
            id: addedItem.product._id,
            quantity: addedItem.quantity,
            name: addedItem.product.name,
            subtotal: addedItem.subtotal.toFixed(2),
            subtotal_tax: '0.00',
            total: addedItem.total.toFixed(2),
            total_tax: '0.00',
            price: addedItem.price.toFixed(2),
            product: {
                id: addedItem.product._id,
                name: addedItem.product.name,
                slug: addedItem.product.slug,
                permalink: addedItem.product.permalink,
                price: addedItem.product.price.toFixed(2),
                regular_price: addedItem.product.regularPrice.toFixed(2),
                sale_price: addedItem.product.salePrice ? addedItem.product.salePrice.toFixed(2) : '',
                on_sale: addedItem.product.onSale,
                purchasable: addedItem.product.purchasable,
                stock_status: addedItem.product.stockStatus
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item
// @route   POST /wp-json/wc/v3/cart/update-item
// @access  Private
exports.updateCartItem = async (req, res, next) => {
    try {
        const { key, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                code: 'cart_not_found',
                message: 'Cart not found',
                data: { status: 404 }
            });
        }

        await cart.updateItem(key, quantity);

        res.status(200).json({ success: true, message: 'Cart updated' });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove cart item
// @route   POST /wp-json/wc/v3/cart/remove-item
// @access  Private
exports.removeCartItem = async (req, res, next) => {
    try {
        const { key } = req.body;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                code: 'cart_not_found',
                message: 'Cart not found',
                data: { status: 404 }
            });
        }

        await cart.removeItem(key);

        res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   POST /wp-json/wc/v3/cart/clear
// @access  Private
exports.clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                code: 'cart_not_found',
                message: 'Cart not found',
                data: { status: 404 }
            });
        }

        await cart.clearCart();

        res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        next(error);
    }
};

module.exports.getCategories = exports.getCategories;
module.exports.getCategory = exports.getCategory;
module.exports.createCategory = exports.createCategory;
module.exports.updateCategory = exports.updateCategory;
module.exports.deleteCategory = exports.deleteCategory;
module.exports.getCart = exports.getCart;
module.exports.addToCart = exports.addToCart;
module.exports.updateCartItem = exports.updateCartItem;
module.exports.removeCartItem = exports.removeCartItem;
module.exports.clearCart = exports.clearCart;