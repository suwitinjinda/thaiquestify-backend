// models/StreakSettings.js
const mongoose = require('mongoose');

const streakSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    enum: ['streak'],
    default: 'streak'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to initialize default streak settings
streakSettingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      key: 'streak_7_days_points',
      displayName: 'รางวัล Streak 7 วัน',
      description: 'คะแนนที่ได้รับเมื่อทำ streak 7 วัน',
      value: 10,
      category: 'streak'
    },
    {
      key: 'streak_14_days_points',
      displayName: 'รางวัล Streak 14 วัน',
      description: 'คะแนนที่ได้รับเมื่อทำ streak 14 วัน',
      value: 50,
      category: 'streak'
    },
    {
      key: 'streak_30_days_points',
      displayName: 'รางวัล Streak 30 วัน',
      description: 'คะแนนที่ได้รับเมื่อทำ streak 30 วัน',
      value: 100,
      category: 'streak'
    },
    {
      key: 'default_reward_streak_required',
      displayName: 'Streak ที่ต้องการสำหรับรางวัล (ค่าเริ่มต้น)',
      description: 'Streak ที่ต้องการสำหรับรางวัลทั่วไป (สามารถแก้ไขได้ในแต่ละรางวัล)',
      value: 14,
      category: 'streak'
    },
    {
      key: 'minimum_streak_days_for_reward',
      displayName: 'จำนวนวัน Streak ขั้นต่ำสำหรับรับรางวัล',
      description: 'จำนวนวัน Streak ขั้นต่ำที่ผู้ใช้ต้องมีเพื่อให้สามารถรับรางวัลได้ (ถ้า streak ต่ำกว่าค่านี้จะไม่สามารถรับรางวัลได้)',
      value: 0,
      category: 'streak'
    },
    {
      key: 'streak_multiplier_enabled',
      displayName: 'เปิดตัวคูณ Streak',
      description: 'เปิด/ปิดการใช้ตัวคูณ Streak ในการคำนวณคะแนน (เมื่อเปิด คะแนนจะถูกคูณตาม streak ของผู้ใช้)',
      value: 1, // 1 = enabled, 0 = disabled
      category: 'streak'
    },
    {
      key: 'cash_reward_limit',
      displayName: 'จำนวนจำกัดสำหรับรางวัลเงินสด',
      description: 'จำนวนจำกัดของผู้ใช้ที่สามารถแลกรางวัลเงินสดได้ (เมื่อครบจำนวนนี้จะไม่สามารถแลกได้อีก)',
      value: 100,
      category: 'streak'
    }
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true, new: true }
    );
  }

  return defaults;
};

// Static method to get all active streak settings
streakSettingsSchema.statics.getActiveSettings = async function() {
  return await this.find({ isActive: true }).sort({ key: 1 });
};

module.exports = mongoose.model('StreakSettings', streakSettingsSchema);
