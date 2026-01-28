const Product = require('../models/product');
const Category = require('../models/category');

// @desc    Get all products
// @route   GET /wp-json/wc/v3/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const {
            page = 1,
            per_page = 10,
            category,
            search,
            orderby = 'date',
            order = 'desc',
            status = 'publish',
            featured,
            on_sale
        } = req.query;

        // Build query
        const query = { status };

        if (category) {
            query.categories = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        if (featured !== undefined) {
            query.featured = featured === 'true';
        }

        if (on_sale !== undefined) {
            query.onSale = on_sale === 'true';
        }

        // Build sort
        let sort = {};
        switch (orderby) {
            case 'title':
                sort = { name: order === 'asc' ? 1 : -1 };
                break;
            case 'price':
                sort = { price: order === 'asc' ? 1 : -1 };
                break;
            case 'popularity':
                sort = { totalSales: order === 'asc' ? 1 : -1 };
                break;
            case 'rating':
                sort = { averageRating: order === 'asc' ? 1 : -1 };
                break;
            default:
                sort = { createdAt: order === 'asc' ? 1 : -1 };
        }

        // Pagination
        const limit = Math.min(parseInt(per_page), parseInt(process.env.MAX_PAGE_SIZE || 100));
        const skip = (parseInt(page) - 1) * limit;

        // Execute query
        const products = await Product.find(query)
            .populate('categories', 'id name slug')
            .populate('tags', 'id name slug')
            .sort(sort)
            .limit(limit)
            .skip(skip);

        // Get total count
        const total = await Product.countDocuments(query);

        // Set pagination headers
        res.set({
            'X-WP-Total': total,
            'X-WP-TotalPages': Math.ceil(total / limit)
        });

        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /wp-json/wc/v3/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categories', 'id name slug')
            .populate('tags', 'id name slug')
            .populate('relatedIds', 'id name price images')
            .populate('upsellIds', 'id name price images')
            .populate('crossSellIds', 'id name price images');

        if (!product) {
            return res.status(404).json({
                code: 'product_not_found',
                message: 'Product not found',
                data: { status: 404 }
            });
        }

        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Create product
// @route   POST /wp-json/wc/v3/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        // Update category counts
        if (product.categories && product.categories.length > 0) {
            for (const categoryId of product.categories) {
                const category = await Category.findById(categoryId);
                if (category) {
                    await category.updateProductCount();
                }
            }
        }

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /wp-json/wc/v3/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                code: 'product_not_found',
                message: 'Product not found',
                data: { status: 404 }
            });
        }

        const oldCategories = product.categories.map(c => c.toString());

        product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Update category counts
        const newCategories = product.categories.map(c => c.toString());
        const allCategories = [...new Set([...oldCategories, ...newCategories])];

        for (const categoryId of allCategories) {
            const category = await Category.findById(categoryId);
            if (category) {
                await category.updateProductCount();
            }
        }

        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /wp-json/wc/v3/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                code: 'product_not_found',
                message: 'Product not found',
                data: { status: 404 }
            });
        }

        const categories = product.categories;

        await product.deleteOne();

        // Update category counts
        for (const categoryId of categories) {
            const category = await Category.findById(categoryId);
            if (category) {
                await category.updateProductCount();
            }
        }

        res.status(200).json({
            id: product._id,
            deleted: true
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search products
// @route   GET /wp-json/wc/v3/products?search=query
// @access  Public
exports.searchProducts = async (req, res, next) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.status(400).json({
                code: 'missing_search_query',
                message: 'Search query is required',
                data: { status: 400 }
            });
        }

        const products = await Product.find({
            $text: { $search: search },
            status: 'publish'
        })
            .select('id name slug price images')
            .limit(20);

        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};