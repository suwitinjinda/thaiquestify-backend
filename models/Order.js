const mongoose = require('mongoose');

// Order - คำสั่งซื้ออาหาร
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    sparse: true, // Allow null values for uniqueness
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodMenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  deliveryAddress: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'card', 'other'],
    default: 'cash',
  },
  // Delivery information
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    default: null,
  },
  // Delivery request (if shop requests delivery service)
  deliveryRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryRequest',
    default: null,
  },
  // Rider assigned to this order
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
}, {
  timestamps: true,
});

// Generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber || this.isNew) {
    try {
      // Get count of orders today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await mongoose.model('Order').countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(6, '0');

      this.orderNumber = `ORD${year}${month}${day}${sequence}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-10);
      this.orderNumber = `ORD${timestamp}`;
    }
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ shop: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
