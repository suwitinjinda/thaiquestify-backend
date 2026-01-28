const mongoose = require('mongoose');

/**
 * ShopFeeSplitRecord – บันทึกการแบ่ง Fee (Platform vs Partner) สำหรับสถิติในอนาคต
 * สร้างเมื่อหัก Fee จากร้านแล้วแบ่งเป็น partnerShare + platformShare
 * หรือเมื่อหักค่าธรรมเนียมงาน (job fees) ซึ่งทั้งหมดเป็น platformShare
 */
const shopFeeSplitRecordSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: function() {
      // Required only for shop-related fees (delivery, dine_in)
      return ['delivery', 'dine_in'].includes(this.feeType);
    },
    index: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true,
  },
  // Job-related fields (for job_application_fee and job_commission_fee)
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
    index: true,
  },
  jobApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication',
    default: null,
    index: true,
  },
  feeType: {
    type: String,
    enum: ['delivery', 'dine_in', 'job_application_fee', 'job_commission_fee', 'tourist_quest'],
    required: true,
    index: true,
  },
  feeAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  partnerShare: {
    type: Number,
    required: true,
    min: 0,
  },
  platformShare: {
    type: Number,
    required: true,
    min: 0,
  },
  /** commission rate used for this split (e.g. 20) */
  commissionRatePercent: {
    type: Number,
    default: null,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  partnerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    default: null,
    index: true,
  },
  orderNumber: {
    type: String,
    default: '',
  },
  shopName: {
    type: String,
    default: '',
  },
  // Job-related display fields
  jobNumber: {
    type: String,
    default: '',
  },
  jobTitle: {
    type: String,
    default: '',
  },
  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
}, {
  timestamps: true,
});

shopFeeSplitRecordSchema.index({ createdAt: -1 });
shopFeeSplitRecordSchema.index({ shop: 1, createdAt: -1 });
shopFeeSplitRecordSchema.index({ partnerId: 1, createdAt: -1 });
shopFeeSplitRecordSchema.index({ feeType: 1, createdAt: -1 });
shopFeeSplitRecordSchema.index({ job: 1, createdAt: -1 });
shopFeeSplitRecordSchema.index({ jobApplication: 1, createdAt: -1 });

module.exports = mongoose.model('ShopFeeSplitRecord', shopFeeSplitRecordSchema);
