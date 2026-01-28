const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    shortDescription: {
        type: String,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    regularPrice: {
        type: Number,
        min: [0, 'Regular price cannot be negative']
    },
    salePrice: {
        type: Number,
        min: [0, 'Sale price cannot be negative']
    },
    onSale: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['simple', 'variable', 'grouped', 'external'],
        default: 'simple'
    },
    status: {
        type: String,
        enum: ['publish', 'draft', 'pending', 'private'],
        default: 'publish'
    },
    featured: {
        type: Boolean,
        default: false
    },
    catalogVisibility: {
        type: String,
        enum: ['visible', 'catalog', 'search', 'hidden'],
        default: 'visible'
    },
    purchasable: {
        type: Boolean,
        default: true
    },
    totalSales: {
        type: Number,
        default: 0
    },
    virtual: {
        type: Boolean,
        default: false
    },
    downloadable: {
        type: Boolean,
        default: false
    },
    externalUrl: {
        type: String,
        trim: true
    },
    buttonText: {
        type: String,
        trim: true
    },
    taxStatus: {
        type: String,
        enum: ['taxable', 'shipping', 'none'],
        default: 'taxable'
    },
    taxClass: {
        type: String,
        default: ''
    },
    manageStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 0
    },
    stockStatus: {
        type: String,
        enum: ['instock', 'outofstock', 'onbackorder'],
        default: 'instock'
    },
    backorders: {
        type: String,
        enum: ['no', 'notify', 'yes'],
        default: 'no'
    },
    backordersAllowed: {
        type: Boolean,
        default: false
    },
    backordered: {
        type: Boolean,
        default: false
    },
    soldIndividually: {
        type: Boolean,
        default: false
    },
    weight: {
        type: String,
        default: ''
    },
    dimensions: {
        length: { type: String, default: '' },
        width: { type: String, default: '' },
        height: { type: String, default: '' }
    },
    shippingRequired: {
        type: Boolean,
        default: true
    },
    shippingTaxable: {
        type: Boolean,
        default: true
    },
    shippingClass: {
        type: String,
        default: ''
    },
    reviewsAllowed: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    relatedIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    upsellIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    crossSellIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    images: [{
        id: String,
        src: String,
        name: String,
        alt: String,
        position: { type: Number, default: 0 }
    }],
    attributes: [{
        id: Number,
        name: String,
        slug: String,
        options: [String],
        position: { type: Number, default: 0 },
        visible: { type: Boolean, default: true },
        variation: { type: Boolean, default: false }
    }],
    defaultAttributes: [{
        name: String,
        option: String
    }],
    variations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation'
    }],
    groupedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    menuOrder: {
        type: Number,
        default: 0
    },
    metaData: [{
        key: String,
        value: mongoose.Schema.Types.Mixed
    }],
    purchaseNote: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug before saving
productSchema.pre('save', function (next) {
    if (!this.slug || this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }

    // Set regular price to price if not provided
    if (!this.regularPrice) {
        this.regularPrice = this.price;
    }

    // Determine if on sale
    if (this.salePrice && this.salePrice < this.regularPrice) {
        this.onSale = true;
        this.price = this.salePrice;
    } else {
        this.onSale = false;
        this.price = this.regularPrice;
    }

    // Update stock status based on quantity
    if (this.manageStock) {
        if (this.stockQuantity <= 0) {
            this.stockStatus = 'outofstock';
        } else {
            this.stockStatus = 'instock';
        }
    }

    next();
});

// Virtual for permalink
productSchema.virtual('permalink').get(function () {
    return `/product/${this.slug}`;
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ price: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);