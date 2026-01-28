const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    display: {
        type: String,
        enum: ['default', 'products', 'subcategories', 'both'],
        default: 'default'
    },
    image: {
        id: String,
        src: String,
        name: String,
        alt: String
    },
    menuOrder: {
        type: Number,
        default: 0
    },
    count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug before saving
categorySchema.pre('save', function (next) {
    if (!this.slug || this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Update product count
categorySchema.methods.updateProductCount = async function () {
    const Product = mongoose.model('Product');
    this.count = await Product.countDocuments({ categories: this._id, status: 'publish' });
    await this.save();
};

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ menuOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);