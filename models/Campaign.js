// backend/models/Campaign.js - แคมเปญส่งเสริมการขาย (ร้าน)
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },

  pointsPerCompletion: { type: Number, required: true, min: 0 }, // used when pointsType === 'fixed'
  maxParticipants: { type: Number, default: 0 }, // 0 = ไม่จำกัด

  // ยอดสั่งสูงสุด (บาท) – ลูกค้าสั่งได้ห้ามเกินกว่านี้ ถึงจะใช้แคมเปญได้ (0 = ไม่จำกัด). ตัวอย่าง 40 = สั่งไม่เกิน 40 บาท แพลตฟอร์มจ่าย Point ให้ร้านเท่ากับยอดอาหาร
  maxOrderBaht: { type: Number, default: 0, min: 0 },
  // วิธีให้ Point: fixed = ใช้ pointsPerCompletion ต่อครั้ง | equal_to_food_amount = ให้ Point เท่ากับยอดอาหารที่เช็คเอาท์ (ไม่รวมค่าส่ง) แพลตฟอร์มจ่ายให้ร้าน
  pointsType: {
    type: String,
    enum: ['fixed', 'equal_to_food_amount'],
    default: 'fixed'
  },

  type: {
    type: String,
    enum: ['one_time', 'daily'],
    default: 'one_time'
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'ended'],
    default: 'draft'
  },

  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

campaignSchema.index({ shop: 1, status: 1 });
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
