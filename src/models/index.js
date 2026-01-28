const mongoose = require('mongoose');

// Wishlist Model
const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure a user can't add the same product twice
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Review Model
const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewer: {
        type: String,
        required: true
    },
    reviewerEmail: {
        type: String,
        required: true
    },
    review: {
        type: String,
        required: [true, 'Review text is required'],
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    status: {
        type: String,
        enum: ['approved', 'hold', 'spam', 'trash'],
        default: 'hold'
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// One review per user per product
reviewSchema.index({ customer: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ status: 1 });

// Update product rating after review save/update
reviewSchema.post('save', async function () {
    await updateProductRating(this.product);
});

reviewSchema.post('remove', async function () {
    await updateProductRating(this.product);
});

async function updateProductRating(productId) {
    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');

    const stats = await Review.aggregate([
        {
            $match: {
                product: productId,
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                ratingCount: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            ratingCount: stats[0].ratingCount
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            ratingCount: 0
        });
    }
}

const Review = mongoose.model('Review', reviewSchema);

// Tag Model
const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        default: ''
    },
    count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

tagSchema.pre('save', function (next) {
    if (!this.slug || this.isModified('name')) {
        const slugify = require('slugify');
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = {
    Wishlist,
    Review,
    Tag
};