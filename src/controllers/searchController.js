const Product = require('../models/product');
const Category = require('../models/category');

// @desc    Global search
// @route   GET /wp-json/tradebakerz/wc/v1/search
// @access  Public
exports.globalSearch = async (req, res, next) => {
    try {
        const {
            q,
            type = 'products',
            page = 1,
            per_page = 10
        } = req.query;

        if (!q) {
            return res.status(400).json({
                code: 'missing_search_query',
                message: 'Search query is required',
                data: { status: 400 }
            });
        }

        const limit = Math.min(parseInt(per_page), 100);
        const skip = (parseInt(page) - 1) * limit;

        const response = {
            products: [],
            categories: [],
            total_count: 0
        };

        // Search products
        if (type === 'products' || type === 'all') {
            const products = await Product.find({
                $text: { $search: q },
                status: 'publish'
            })
                .select('id name price images')
                .limit(limit)
                .skip(skip);

            response.products = products.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price.toFixed(2),
                image: product.images && product.images[0] ? product.images[0].src : null,
                permalink: product.permalink
            }));

            response.total_count += products.length;
        }

        // Search categories
        if (type === 'categories' || type === 'all') {
            const categories = await Category.find({
                name: { $regex: q, $options: 'i' }
            })
                .select('id name slug image')
                .limit(limit);

            response.categories = categories.map(category => ({
                id: category._id,
                name: category.name,
                slug: category.slug,
                image: category.image ? category.image.src : null
            }));

            response.total_count += categories.length;
        }

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};