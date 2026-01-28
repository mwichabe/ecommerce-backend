const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    subtotalTax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    totalTax: {
        type: Number,
        default: 0
    },
    variation: {
        type: Map,
        of: String
    }
});

const shippingLineSchema = new mongoose.Schema({
    methodId: {
        type: String,
        required: true
    },
    methodTitle: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    totalTax: {
        type: Number,
        default: 0
    }
});

const orderSchema = new mongoose.Schema({
    orderKey: {
        type: String,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'],
        default: 'pending'
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentMethodTitle: {
        type: String,
        required: true
    },
    transactionId: {
        type: String
    },
    setPaid: {
        type: Boolean,
        default: false
    },
    billing: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        company: String,
        address1: { type: String, required: true },
        address2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        postcode: { type: String, required: true },
        country: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    shipping: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        company: String,
        address1: { type: String, required: true },
        address2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        postcode: { type: String, required: true },
        country: { type: String, required: true }
    },
    lineItems: [orderItemSchema],
    shippingLines: [shippingLineSchema],
    couponLines: [{
        code: String,
        discount: Number,
        discountTax: Number
    }],
    feeLines: [{
        name: String,
        total: Number,
        totalTax: Number
    }],
    taxLines: [{
        rateCode: String,
        rateId: String,
        label: String,
        compound: Boolean,
        taxTotal: Number,
        shippingTaxTotal: Number
    }],
    totals: {
        subtotal: {
            type: Number,
            required: true
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
            required: true
        },
        totalTax: {
            type: Number,
            default: 0
        }
    },
    customerNote: {
        type: String
    },
    orderNotes: [{
        note: String,
        addedBy: String,
        customerNote: Boolean,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    datePaid: {
        type: Date
    },
    dateCompleted: {
        type: Date
    },
    cartHash: {
        type: String
    }
}, {
    timestamps: true
});

// Generate order key before saving
orderSchema.pre('save', function (next) {
    if (!this.orderKey) {
        this.orderKey = `wc_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// Calculate order totals
orderSchema.methods.calculateTotals = function () {
    let subtotal = 0;
    let subtotalTax = 0;

    this.lineItems.forEach(item => {
        subtotal += item.subtotal;
        subtotalTax += item.subtotalTax;
    });

    let shipping = 0;
    let shippingTax = 0;

    this.shippingLines.forEach(line => {
        shipping += line.total;
        shippingTax += line.totalTax;
    });

    let discount = 0;
    let discountTax = 0;

    this.couponLines.forEach(coupon => {
        discount += coupon.discount;
        discountTax += coupon.discountTax;
    });

    const totalTax = subtotalTax + shippingTax - discountTax;
    const total = subtotal + shipping - discount + totalTax;

    this.totals = {
        subtotal,
        subtotalTax,
        shipping,
        shippingTax,
        discount,
        discountTax,
        total,
        totalTax
    };

    return this.totals;
};

// Add order note
orderSchema.methods.addNote = function (note, addedBy = 'system', customerNote = false) {
    this.orderNotes.push({
        note,
        addedBy,
        customerNote,
        createdAt: new Date()
    });
};

// Update order status
orderSchema.methods.updateStatus = async function (newStatus, note = null) {
    const oldStatus = this.status;
    this.status = newStatus;

    if (newStatus === 'completed' && !this.dateCompleted) {
        this.dateCompleted = new Date();
    }

    if (this.setPaid && !this.datePaid) {
        this.datePaid = new Date();
    }

    if (note) {
        this.addNote(`Order status changed from ${oldStatus} to ${newStatus}. ${note}`);
    } else {
        this.addNote(`Order status changed from ${oldStatus} to ${newStatus}`);
    }

    await this.save();
    return this;
};

// Indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderKey: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);