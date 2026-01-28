const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');

// @route   GET /tradebakerz/wc/v1/search
// @desc    Global search across products and categories
// @access  Public
// @query   q - search query (required)
// @query   type - search type: products, categories, all (default: products)
// @query   page - page number
// @query   per_page - items per page
router.get('/tradebakerz/wc/v1/search', globalSearch);

module.exports = router;