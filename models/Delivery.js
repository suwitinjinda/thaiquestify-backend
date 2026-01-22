const mongoose = require('mongoose');

// Delivery - ระบบส่งอาหาร (สำหรับ rider/delivery person)
const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    sparse: true,
    index: true,
  },
  // คำสั่งซื้อที่เกี่ยวข้อง
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  // ร้านค้า
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  // ลูกค้า
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // คนส่ง (rider) - User ID for reference
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  // Rider Code for easier querying
  riderCode: {
    type: String,
    default: null,
    index: true,
  },
  // ที่อยู่ส่ง
  deliveryAddress: {
    type: String,
    required: true,
  },
  // พิกัดที่ส่ง
  deliveryCoordinates: {
    latitude: Number,
    longitude: Number,
  },
  // พิกัดร้านค้า
  shopCoordinates: {
    latitude: Number,
    longitude: Number,
  },
  // ระยะทาง (กิโลเมตร)
  distance: {
    type: Number,
    default: 0,
    min: 0,
  },
  // ค่าจัดส่ง
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
  },
  // ค่าจ้าง rider
  riderFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  // ราคาอาหาร
  foodCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  // ราคารวมทั้งหมด (food cost + rider cost)
  totalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  // สถานะการส่ง
  status: {
    type: String,
    enum: ['pending', 'assigned', 'heading_to_shop', 'at_shop', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    index: true,
  },
  // เวลาที่รับงาน
  assignedAt: {
    type: Date,
    default: null,
  },
  // เวลาที่ไปรับอาหาร
  pickedUpAt: {
    type: Date,
    default: null,
  },
  // เวลาที่ส่งสำเร็จ
  deliveredAt: {
    type: Date,
    default: null,
  },
  // หมายเหตุ
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  // รูปภาพส่งอาหาร (หลักฐาน)
  deliveryPhoto: {
    type: String,
    default: null,
  },
  // หมายเลขโทรศัพท์ติดต่อ
  contactPhone: {
    type: String,
    required: true,
  },
  // การให้คะแนน
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      maxlength: 500,
      default: '',
    },
    ratedAt: {
      type: Date,
      default: null,
    },
  },
  // Shop payment (points paid to rider when picking up)
  shopPaidPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Shop payment timestamp
  shopPaidAt: {
    type: Date,
    default: null,
  },
  // Rider penalty points (if rider cancels)
  riderPenaltyPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Is this a reassignment?
  isReassignment: {
    type: Boolean,
    default: false,
  },
  // Previous rider (if reassigned)
  previousRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Reassignment fee
  reassignmentFee: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Generate delivery number
deliverySchema.pre('save', async function (next) {
  if (!this.deliveryNumber || this.isNew) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await mongoose.model('Delivery').countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(6, '0');

      this.deliveryNumber = `DLV${year}${month}${day}${sequence}`;
    } catch (error) {
      console.error('Error generating delivery number:', error);
      const timestamp = Date.now().toString().slice(-10);
      this.deliveryNumber = `DLV${timestamp}`;
    }
  }
  next();
});

// Indexes
deliverySchema.index({ order: 1 });
deliverySchema.index({ rider: 1, status: 1, createdAt: -1 });
deliverySchema.index({ riderCode: 1, status: 1, createdAt: -1 });
deliverySchema.index({ shop: 1, status: 1 });
deliverySchema.index({ customer: 1, status: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Delivery', deliverySchema);
