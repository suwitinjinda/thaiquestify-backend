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
  serviceFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  vatAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
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
  /** Set when customer presses "จ่ายเงินแล้ว"; shop can confirm "ได้รับเงินแล้ว" only when status=completed and this is set */
  customerPressedPayAt: {
    type: Date,
    default: null,
  },
  // Order type: 'dine_in' or 'delivery'
  orderType: {
    type: String,
    enum: ['dine_in', 'delivery'],
    default: 'dine_in',
    index: true,
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
  // Who cancelled the order: 'customer', 'shop', 'rider', 'system', or null
  cancelledBy: {
    type: String,
    enum: ['customer', 'shop', 'rider', 'system'],
    required: false,
    // No default - will be undefined/null for new orders
  },
  /** ค่าธรรมเนียมส่งที่บ้านหักแล้วเมื่อ rider รับงาน + ร้านยืนยัน order */
  shopDeliveryFeeDeducted: {
    type: Boolean,
    default: false,
  },
  /** ค่าคอมมิชชั่น Partner Shop (บาท) - คำนวณจาก order total เมื่อร้านยืนยันรับเงิน */
  commissionAmount: {
    type: Number,
    default: 0,
    min: 0,
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
