const mongoose = require('mongoose');

/**
 * QuestSettings Model
 * Stores configurable settings for quest templates and point values
 */
const questSettingsSchema = new mongoose.Schema({
  // Setting Key (unique identifier)
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Setting Category
  category: {
    type: String,
    required: true,
    enum: ['points', 'quests', 'social', 'streak', 'system'],
    default: 'points'
  },

  // Setting Value (can be number, string, or object)
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Display name (Thai)
  displayName: {
    type: String,
    required: true
  },

  // Description
  description: {
    type: String,
    default: ''
  },

  // Value type for validation
  valueType: {
    type: String,
    enum: ['number', 'string', 'boolean', 'object'],
    default: 'number'
  },

  // Min/Max constraints for numbers
  minValue: {
    type: Number,
    default: null
  },
  maxValue: {
    type: Number,
    default: null
  },

  // Is this setting active?
  isActive: {
    type: Boolean,
    default: true
  },

  // Last modified by
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default settings to seed
questSettingsSchema.statics.getDefaultSettings = function() {
  return [
    // Points Settings
    {
      key: 'daily_checkin_points',
      category: 'points',
      displayName: 'คะแนน Check-in รายวัน',
      description: 'คะแนนที่ได้รับจากการ check-in รายวัน',
      value: 1,
      valueType: 'number',
      minValue: 1,
      maxValue: 100
    },
    {
      key: 'social_quest_base_points',
      category: 'points',
      displayName: 'คะแนนเควสชุมชน (พื้นฐาน)',
      description: 'คะแนนพื้นฐานที่ได้รับจากการทำเควสชุมชน',
      value: 1,
      valueType: 'number',
      minValue: 1,
      maxValue: 100
    },
    {
      key: 'daily_bonus_points',
      category: 'points',
      displayName: 'โบนัสทำครบเควสรายวัน',
      description: 'โบนัสเพิ่มเติมเมื่อทำเควสรายวันครบทั้งหมด',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 100
    },
    {
      key: 'tiktok_follow_cost',
      category: 'points',
      displayName: 'ค่าใช้จ่ายสร้างเควส TikTok Follow',
      description: 'คะแนนที่ต้องใช้ในการสร้างเควส TikTok Follow',
      value: 5,
      valueType: 'number',
      minValue: 1,
      maxValue: 1000
    },
    {
      key: 'tiktok_share_url_cost',
      category: 'points',
      displayName: 'ค่าใช้จ่ายสร้างเควส TikTok Share URL',
      description: 'คะแนนที่ต้องใช้ในการสร้างเควส TikTok Share URL',
      value: 5,
      valueType: 'number',
      minValue: 1,
      maxValue: 1000
    },
    {
      key: 'new_user_bonus_points',
      category: 'points',
      displayName: 'คะแนนต้อนรับผู้ใช้ใหม่',
      description: 'คะแนนที่ผู้ใช้ใหม่ได้รับเมื่อสมัคร',
      value: 1000,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },


    // Quest Settings
    {
      key: 'max_daily_social_quests',
      category: 'quests',
      displayName: 'จำนวนเควสชุมชนสูงสุดต่อวัน',
      description: 'จำนวนเควสชุมชนสูงสุดที่แสดงในเควสรายวัน',
      value: 4,
      valueType: 'number',
      minValue: 0,
      maxValue: 10
    },
    {
      key: 'quest_approval_required',
      category: 'quests',
      displayName: 'ต้องอนุมัติเควสก่อนเผยแพร่',
      description: 'กำหนดให้เควสใหม่ต้องได้รับการอนุมัติจาก admin ก่อน',
      value: false,
      valueType: 'boolean'
    },
    {
      key: 'social_quest_expiry_days',
      category: 'quests',
      displayName: 'วันหมดอายุเควสชุมชน',
      description: 'จำนวนวันที่เควสชุมชนจะหมดอายุหลังสร้าง',
      value: 7,
      valueType: 'number',
      minValue: 1,
      maxValue: 30
    },
    {
      key: 'tourist_checkin_points',
      category: 'points',
      displayName: 'คะแนนเช็คอินสถานที่ท่องเที่ยว',
      description: 'คะแนนที่ได้รับจากการเช็คอินที่สถานที่ท่องเที่ยว (ทำได้ครั้งเดียว)',
      value: 10,
      valueType: 'number',
      minValue: 1,
      maxValue: 1000
    }
  ];
};

// Initialize default settings
questSettingsSchema.statics.initializeDefaults = async function() {
  const defaults = this.getDefaultSettings();
  
  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Quest settings initialized with defaults');
};

// Get setting by key
questSettingsSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key, isActive: true });
  return setting ? setting.value : null;
};

// Get all settings by category
questSettingsSchema.statics.getSettingsByCategory = async function(category) {
  return this.find({ category, isActive: true }).sort('displayName');
};

// Update setting
questSettingsSchema.statics.updateSetting = async function(key, value, userId) {
  return this.findOneAndUpdate(
    { key },
    { 
      value,
      lastModifiedBy: userId,
      updatedAt: new Date()
    },
    { new: true }
  );
};

const QuestSettings = mongoose.model('QuestSettings', questSettingsSchema);

module.exports = QuestSettings;
