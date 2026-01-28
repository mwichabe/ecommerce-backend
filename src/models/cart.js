const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    variation: {
        type: Map,
        of: String
    },
    price: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totals: {
        subtotal: {
            type: Number,
            default: 0
        },
        subtotalTax: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            default: 0
        },
        shippingTax: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        discountTax: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        },
        totalTax: {
            type: Number,
            default: 0
        }
    },
    coupons: [{
        code: String,
        discount: Number
    }],
    shippingMethod: {
        id: String,
        label: String,
        cost: Number
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
}, {
    timestamps: true
});

// Calculate cart totals
cartSchema.methods.calculateTotals = function () {
    let subtotal = 0;

    this.items.forEach(item => {
        item.subtotal = item.price * item.quantity;
        item.total = item.subtotal;
        subtotal += item.subtotal;
    });

    this.totals.subtotal = subtotal;
    this.totals.total = subtotal + this.totals.shipping - this.totals.discount;

    return this.totals;
};

// Add item to cart
cartSchema.methods.addItem = async function (productId, quantity = 1, variation = null) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    if (!product.purchasable || product.stockStatus === 'outofstock') {
        throw new Error('Product is not available for purchase');
    }

    // Check if item already exists
    const existingItemIndex = this.items.findIndex(item =>
        item.product.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
    } else {
        this.items.push({
            product: productId,
            quantity,
            variation: variation ? new Map(Object.entries(variation)) : null,
            price: product.price,
            subtotal: product.price * quantity,
            total: product.price * quantity
        });
    }

    this.calculateTotals();
    await this.save();

    return this;
};

// Update item quantity
cartSchema.methods.updateItem = async function (itemId, quantity) {
    const item = this.items.id(itemId);

    if (!item) {
        throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
        this.items.pull(itemId);
    } else {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        item.total = item.subtotal;
    }

    this.calculateTotals();
    await this.save();

    return this;
};

// Remove item from cart
cartSchema.methods.removeItem = async function (itemId) {
    this.items.pull(itemId);
    this.calculateTotals();
    await this.save();

    return this;
};

// Clear cart
cartSchema.methods.clearCart = async function () {
    this.items = [];
    this.coupons = [];
    this.calculateTotals();
    await this.save();

    return this;
};

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cart', cartSchema);