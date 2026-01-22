const mongoose = require('mongoose');

// DeliveryRequest - คำขอใช้บริการส่งอาหารของร้านค้า
const deliveryRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    sparse: true,
    index: true,
  },
  // ร้านค้าที่ขอใช้บริการ
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  // คำสั่งซื้อที่ต้องการส่ง
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
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
  // ระยะทาง (กิโลเมตร)
  distance: {
    type: Number,
    required: true,
    min: 0,
  },
  // ค่าจัดส่งที่ร้านค้าต้องการให้ลูกค้าจ่าย
  requestedDeliveryFee: {
    type: Number,
    required: true,
    min: 0,
  },
  // ค่าจ้าง rider ที่ร้านค้าพร้อมจ่าย
  riderFee: {
    type: Number,
    required: true,
    min: 0,
  },
  // หมายเหตุ
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  // หมายเลขโทรศัพท์ติดต่อ
  contactPhone: {
    type: String,
    required: true,
  },
  // เวลาที่ต้องการส่ง
  preferredDeliveryTime: {
    type: Date,
    default: null,
  },
  // สถานะคำขอ
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  // Rider ที่รับงาน - User ID for reference
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
  // Riders ที่ปฏิเสธงานนี้ (เพื่อไม่ให้แสดงซ้ำ)
  rejectedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Riders ที่เคยได้รับ notification แล้ว (เพื่อไม่ให้ส่งซ้ำ)
  notifiedRiders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // เวลาที่รับงาน
  acceptedAt: {
    type: Date,
    default: null,
  },
  // เวลาที่เริ่มส่ง
  startedAt: {
    type: Date,
    default: null,
  },
  // เวลาที่ส่งสำเร็จ
  completedAt: {
    type: Date,
    default: null,
  },
  // เวลาหมดอายุ (ถ้าไม่มีคนรับ)
  expiresAt: {
    type: Date,
    default: null,
  },
  // Priority (calculated from distance)
  priority: {
    type: Number,
    default: 0,
    min: 1,
    max: 10,
    index: true,
  },
  // Assignment method
  assignmentMethod: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },
  // Assignment attempts
  assignmentAttempts: {
    type: Number,
    default: 0,
  },
  // Last assignment attempt time
  lastAssignmentAttempt: {
    type: Date,
    default: null,
  },
  // Reassignment fee (if reassigned)
  reassignmentFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Rider canceled flag
  riderCanceled: {
    type: Boolean,
    default: false,
  },
  // Rider cancel reason
  riderCancelReason: {
    type: String,
    default: '',
    maxlength: 500,
  },
  // Customer canceled flag
  customerCanceled: {
    type: Boolean,
    default: false,
  },
  // Cancellation reason
  cancellationReason: {
    type: String,
    default: '',
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Generate request number
deliveryRequestSchema.pre('save', async function (next) {
  if (!this.requestNumber || this.isNew) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await mongoose.model('DeliveryRequest').countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(6, '0');

      this.requestNumber = `DRQ${year}${month}${day}${sequence}`;
    } catch (error) {
      console.error('Error generating delivery request number:', error);
      const timestamp = Date.now().toString().slice(-10);
      this.requestNumber = `DRQ${timestamp}`;
    }
  }
  next();
});

// Auto-expire pending requests - use expiresAt if already set, otherwise will be set by deliveryAssignmentService
// Note: expiresAt is now set by deliveryAssignmentService based on admin setting (delivery_assignment_timeout)
deliveryRequestSchema.pre('save', function (next) {
  // Only set default expiresAt if not already set and this is a new pending request
  // But deliveryAssignmentService will set it properly, so we don't set a default here
  // This prevents overriding the timeout value from admin settings
  next();
});

// Indexes
deliveryRequestSchema.index({ shop: 1, status: 1, createdAt: -1 });
deliveryRequestSchema.index({ order: 1 });
deliveryRequestSchema.index({ rider: 1, status: 1 });
deliveryRequestSchema.index({ riderCode: 1, status: 1 });
deliveryRequestSchema.index({ status: 1, expiresAt: 1 });
deliveryRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
