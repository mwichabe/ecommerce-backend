const User = require('../models/user');
const { Wishlist, Review } = require('../models');
const Product = require('../models/product');

// ============ CUSTOMER CONTROLLER ============

// @desc    Get customer profile
// @route   GET /wp-json/wc/v3/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');

        if (!customer) {
            return res.status(404).json({
                code: 'customer_not_found',
                message: 'Customer not found',
                data: { status: 404 }
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                code: 'forbidden',
                message: 'Not authorized to access this customer',
                data: { status: 403 }
            });
        }

        res.status(200).json({
            id: customer._id,
            date_created: customer.createdAt,
            date_modified: customer.updatedAt,
            email: customer.email,
            first_name: customer.firstName,
            last_name: customer.lastName,
            username: customer.username,
            role: customer.role,
            billing: customer.billing,
            shipping: customer.shipping,
            is_paying_customer: customer.isPayingCustomer,
            avatar_url: customer.avatar
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer profile
// @route   PUT /wp-json/wc/v3/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
    try {
        const customer = await User.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                code: 'customer_not_found',
                message: 'Customer not found',
                data: { status: 404 }
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                code: 'forbidden',
                message: 'Not authorized to update this customer',
                data: { status: 403 }
            });
        }

        // Update allowed fields
        const allowedUpdates = ['firstName', 'lastName', 'billing', 'shipping', 'avatar'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                customer[field] = req.body[field];
            }
        });

        // Update first_name and last_name if provided in snake_case
        if (req.body.first_name !== undefined) customer.firstName = req.body.first_name;
        if (req.body.last_name !== undefined) customer.lastName = req.body.last_name;

        await customer.save();

        res.status(200).json({
            id: customer._id,
            date_created: customer.createdAt,
            date_modified: customer.updatedAt,
            email: customer.email,
            first_name: customer.firstName,
            last_name: customer.lastName,
            username: customer.username,
            role: customer.role,
            billing: customer.billing,
            shipping: customer.shipping,
            is_paying_customer: customer.isPayingCustomer,
            avatar_url: customer.avatar
        });
    } catch (error) {
        next(error);
    }
};

// ============ WISHLIST CONTROLLER ============

// @desc    Get user wishlist
// @route   GET /wp-json/tradebakerz/wc/v1/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
    try {
        const wishlistItems = await Wishlist.find({ user: req.user._id })
            .populate({
                path: 'product',
                select: 'id name slug price regularPrice salePrice onSale purchasable stockStatus images'
            })
            .sort({ createdAt: -1 });

        const items = wishlistItems.map(item => ({
            id: item._id,
            product_id: item.product._id,
            user_id: item.user,
            date_added: item.createdAt,
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
                stock_status: item.product.stockStatus,
                image: item.product.images && item.product.images[0] ? {
                    id: item.product.images[0].id,
                    src: item.product.images[0].src,
                    name: item.product.images[0].name,
                    alt: item.product.images[0].alt
                } : null
            }
        }));

        res.status(200).json({
            items,
            count: items.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add product to wishlist
// @route   POST /wp-json/tradebakerz/wc/v1/wishlist/add
// @access  Private
exports.addToWishlist = async (req, res, next) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                code: 'missing_product_id',
                message: 'Product ID is required',
                data: { status: 400 }
            });
        }

        // Check if product exists
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                code: 'product_not_found',
                message: 'Product not found',
                data: { status: 404 }
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
            user: req.user._id,
            product: product_id
        });

        if (existing) {
            return res.status(400).json({
                code: 'already_in_wishlist',
                message: 'Product already in wishlist',
                data: { status: 400 }
            });
        }

        const wishlistItem = await Wishlist.create({
            user: req.user._id,
            product: product_id
        });

        res.status(200).json({
            success: true,
            message: 'Product added to wishlist',
            wishlist_id: wishlistItem._id
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /wp-json/tradebakerz/wc/v1/wishlist/:product_id
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const { product_id } = req.params;

        const result = await Wishlist.findOneAndDelete({
            user: req.user._id,
            product: product_id
        });

        if (!result) {
            return res.status(404).json({
                code: 'not_in_wishlist',
                message: 'Product not found in wishlist',
                data: { status: 404 }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        next(error);
    }
};

// ============ REVIEW CONTROLLER ============

// @desc    Get product reviews
// @route   GET /wp-json/wc/v3/products/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
    try {
        const {
            product_id,
            page = 1,
            per_page = 10,
            status = 'approved'
        } = req.query;

        const query = { status };

        if (product_id) {
            query.product = product_id;
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const reviews = await Review.find(query)
            .populate('product', 'id name')
            .populate('customer', 'id username')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await Review.countDocuments(query);

        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(reviews.map(review => ({
            id: review._id,
            date_created: review.createdAt,
            product_id: review.product._id,
            status: review.status,
            reviewer: review.reviewer,
            reviewer_email: review.reviewerEmail,
            review: review.review,
            rating: review.rating,
            verified: review.verified,
            customer_id: review.customer._id
        })));
    } catch (error) {
        next(error);
    }
};

// @desc    Create product review
// @route   POST /wp-json/wc/v3/products/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        const { product_id, review, rating, status = 'hold' } = req.body;

        if (!product_id || !review || !rating) {
            return res.status(400).json({
                code: 'missing_required_fields',
                message: 'Product ID, review text, and rating are required',
                data: { status: 400 }
            });
        }

        // Check if product exists
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                code: 'product_not_found',
                message: 'Product not found',
                data: { status: 404 }
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            customer: req.user._id,
            product: product_id
        });

        if (existingReview) {
            return res.status(400).json({
                code: 'already_reviewed',
                message: 'You have already reviewed this product',
                data: { status: 400 }
            });
        }

        const newReview = await Review.create({
            product: product_id,
            customer: req.user._id,
            reviewer: req.user.fullName || req.user.username,
            reviewerEmail: req.user.email,
            review,
            rating,
            status,
            verified: false
        });

        res.status(201).json({
            id: newReview._id,
            date_created: newReview.createdAt,
            product_id: newReview.product,
            status: newReview.status,
            reviewer: newReview.reviewer,
            reviewer_email: newReview.reviewerEmail,
            review: newReview.review,
            rating: newReview.rating,
            verified: newReview.verified,
            customer_id: newReview.customer
        });
    } catch (error) {
        next(error);
    }
};
