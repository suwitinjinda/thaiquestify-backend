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
        enum: ['points', 'quests', 'social', 'streak', 'system', 'job', 'reward', 'delivery', 'coupon'],
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
    },

    // Job Settings
    {
      key: 'job_commission_fee',
      category: 'job',
      displayName: 'ค่านายหน้าจ้างงาน',
      description: 'จำนวน point ที่หักจากคนจ้างงานทันทีเมื่อได้ลูกจ้างครบแล้ว (points)',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'job_application_fee',
      category: 'job',
      displayName: 'ค่าธรรมเนียมการสมัครงาน',
      description: 'จำนวน point ที่หักจากคนรับงานเมื่อนายจ้างอนุมัติ (points)',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },

    // Delivery Settings สำหรับค่าจ้างส่งอาหาร
    {
      key: 'delivery_min_price',
      category: 'job',
      displayName: 'ค่าจ้างส่งอาหารขั้นต่ำต่อออเดอร์',
      description: 'จำนวนเงินขั้นต่ำที่ร้านค้าต้องจ่ายให้คนส่งอาหารต่อการจัดส่ง 1 ครั้ง',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    {
      key: 'delivery_base_cost',
      category: 'job',
      displayName: 'ต้นทุนพื้นฐานค่าจัดส่งอาหาร',
      description: 'ใช้เป็นค่าพื้นฐานในการคำนวณค่าจัดส่งอาหาร',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    {
      key: 'delivery_default_radius_km',
      category: 'job',
      displayName: 'รัศมีการส่งอาหารเริ่มต้น (กิโลเมตร)',
      description: 'รัศมีการส่งอาหารเริ่มต้นสำหรับร้านค้าใหม่ (กิโลเมตร)',
      value: 10,
      valueType: 'number',
      minValue: 1,
      maxValue: 100
    },

    // Delivery Assignment Settings
    {
      key: 'delivery_auto_assign_enabled',
      category: 'delivery',
      displayName: 'เปิดใช้งาน Auto Assignment',
      description: 'เปิด/ปิดการมอบหมายงานส่งอาหารอัตโนมัติ',
      value: true,
      valueType: 'boolean'
    },
    {
      key: 'delivery_assignment_timeout',
      category: 'delivery',
      displayName: 'เวลารอ Rider ตอบรับงาน (วินาที)',
      description: 'เวลาที่รอให้ Rider ตอบรับงานก่อนจะหาคน rider คนใหม่ (วินาที)',
      value: 120,
      valueType: 'number',
      minValue: 60,
      maxValue: 600
    },
    {
      key: 'delivery_max_retry_attempts',
      category: 'delivery',
      displayName: 'จำนวนครั้งสูงสุดในการหาคน Rider ใหม่',
      description: 'จำนวนครั้งสูงสุดที่ระบบจะหาคน Rider ใหม่ก่อนจะยกเลิก Order (ครั้ง)',
      value: 3,
      valueType: 'number',
      minValue: 1,
      maxValue: 10
    },
    {
      key: 'delivery_notify_riders_count',
      category: 'delivery',
      displayName: 'จำนวน Rider ที่ส่ง Notification',
      description: 'จำนวน Rider ที่จะส่ง notification เมื่อมีงานใหม่',
      value: 3,
      valueType: 'number',
      minValue: 1,
      maxValue: 10
    },
    {
      key: 'rider_max_concurrent_deliveries',
      category: 'delivery',
      displayName: 'จำนวนงานที่ Rider รับพร้อมกันได้',
      description: 'จำนวนงานส่งอาหารที่ Rider สามารถรับพร้อมกันได้',
      value: 2,
      valueType: 'number',
      minValue: 1,
      maxValue: 5
    },
    {
      key: 'shop_pay_when_rider_receive_order',
      category: 'delivery',
      displayName: 'Points ที่ Shop จ่ายเมื่อ Rider รับ Order',
      description: 'จำนวน Points ที่ Shop จะจ่ายให้ Rider เมื่อ Rider ไปรับ Order ที่ร้าน',
      value: 10,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'reassignment_fee',
      category: 'delivery',
      displayName: 'ค่าธรรมเนียม Reassignment',
      description: 'ค่าธรรมเนียมที่เพิ่มเข้าไปเมื่อมีการ Reassign งาน (บาท)',
      value: 0,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'point_to_baht_rate',
      category: 'delivery',
      displayName: 'อัตราแลกเปลี่ยน Point เป็น บาท',
      description: '1 Point = ? บาท (ใช้เมื่อ Customer มีแต้มไม่พอ จะหักเป็นบาทแทน)',
      value: 1,
      valueType: 'number',
      minValue: 0.1,
      maxValue: 100
    },
    {
      key: 'customer_pays_food_and_rider_cost',
      category: 'delivery',
      displayName: 'Customer จ่าย Food Cost + Rider Cost',
      description: 'เปิดใช้งานให้ Customer จ่าย Food Cost + Rider Cost',
      value: true,
      valueType: 'boolean'
    },
    {
      key: 'shop_no_cost_fee',
      category: 'delivery',
      displayName: 'Shop ไม่ต้องจ่าย Cost/Fee',
      description: 'เปิดใช้งานให้ Shop ไม่ต้องจ่าย Cost/Fee',
      value: true,
      valueType: 'boolean'
    },

    // Coupon Settings
    {
      key: 'daily_quest_50_points_enabled',
      category: 'reward',
      displayName: 'เปิดใช้งาน Quest แลกคูปอง 50 แต้ม',
      description: 'เปิด/ปิด quest แลกคูปองส่วนลด 5% ด้วย 50 แต้ม',
      value: true,
      valueType: 'boolean'
    },
    {
      key: 'daily_quest_50_points_cost',
      category: 'reward',
      displayName: 'จำนวนแต้มที่ต้องใช้ (Quest 50 แต้ม)',
      description: 'จำนวนแต้มที่ต้องใช้ในการแลกคูปองส่วนลด 5%',
      value: 50,
      valueType: 'number',
      minValue: 1,
      maxValue: 1000
    },
    {
      key: 'daily_quest_50_points_discount',
      category: 'reward',
      displayName: 'ส่วนลด % (Quest 50 แต้ม)',
      description: 'เปอร์เซ็นต์ส่วนลดที่ได้รับจาก quest 50 แต้ม',
      value: 5,
      valueType: 'number',
      minValue: 1,
      maxValue: 100
    },
    {
      key: 'daily_quest_100_points_enabled',
      category: 'reward',
      displayName: 'เปิดใช้งาน Quest แลกคูปอง 100 แต้ม',
      description: 'เปิด/ปิด quest แลกคูปองส่วนลด 10% ด้วย 100 แต้ม',
      value: true,
      valueType: 'boolean'
    },
    {
      key: 'daily_quest_100_points_cost',
      category: 'reward',
      displayName: 'จำนวนแต้มที่ต้องใช้ (Quest 100 แต้ม)',
      description: 'จำนวนแต้มที่ต้องใช้ในการแลกคูปองส่วนลด 10%',
      value: 100,
      valueType: 'number',
      minValue: 1,
      maxValue: 1000
    },
    {
      key: 'daily_quest_100_points_discount',
      category: 'reward',
      displayName: 'ส่วนลด % (Quest 100 แต้ม)',
      description: 'เปอร์เซ็นต์ส่วนลดที่ได้รับจาก quest 100 แต้ม',
      value: 10,
      valueType: 'number',
      minValue: 1,
      maxValue: 100
    },
    {
      key: 'coupon_expiry_days',
      category: 'reward',
      displayName: 'อายุคูปอง (วัน)',
      description: 'จำนวนวันที่คูปองจะหมดอายุ',
      value: 1,
      valueType: 'number',
      minValue: 1,
      maxValue: 30
    },
    {
      key: 'auto_coupon_on_checkin',
      category: 'reward',
      displayName: 'สร้างคูปองอัตโนมัติเมื่อทำ Check-in',
      description: 'สร้างคูปองส่วนลด 5% อัตโนมัติเมื่อทำ check-in quest เสร็จ (quest แรกของวัน)',
      value: true,
      valueType: 'boolean'
    },
    {
      key: 'coupon_usage_fee',
      category: 'reward',
      displayName: 'ค่าธรรมเนียมการใช้คูปอง (ครั้งแรกต่อวัน)',
      description: 'จำนวนแต้มที่หักจากผู้ใช้เมื่อใช้คูปองครั้งแรกของวัน (คิดครั้งเดียวต่อวันต่อ user, reset after midnight)',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    // Coupon Minimum Amount Settings
    {
      key: 'coupon_min_amount_5',
      category: 'coupon',
      displayName: 'ยอดเงินขั้นต่ำสำหรับคูปองส่วนลด 5%',
      description: 'ยอดเงินขั้นต่ำที่ต้องซื้อเพื่อใช้คูปองส่วนลด 5% (บาท)',
      value: 50,
      valueType: 'number',
      minValue: 0,
      maxValue: 100000
    },
    {
      key: 'coupon_min_amount_10',
      category: 'coupon',
      displayName: 'ยอดเงินขั้นต่ำสำหรับคูปองส่วนลด 10%',
      description: 'ยอดเงินขั้นต่ำที่ต้องซื้อเพื่อใช้คูปองส่วนลด 10% (บาท)',
      value: 500,
      valueType: 'number',
      minValue: 0,
      maxValue: 100000
    },
    {
      key: 'coupon_min_amount_15',
      category: 'coupon',
      displayName: 'ยอดเงินขั้นต่ำสำหรับคูปองส่วนลด 15%',
      description: 'ยอดเงินขั้นต่ำที่ต้องซื้อเพื่อใช้คูปองส่วนลด 15% (บาท)',
      value: 1000,
      valueType: 'number',
      minValue: 0,
      maxValue: 100000
    },
    {
      key: 'coupon_min_amount_20',
      category: 'coupon',
      displayName: 'ยอดเงินขั้นต่ำสำหรับคูปองส่วนลด 20%',
      description: 'ยอดเงินขั้นต่ำที่ต้องซื้อเพื่อใช้คูปองส่วนลด 20% (บาท)',
      value: 50000,
      valueType: 'number',
      minValue: 0,
      maxValue: 100000
    },
    {
      key: 'delivery_minimum_fee',
      category: 'delivery',
      displayName: 'ค่าจัดส่งขั้นต่ำ (บาท)',
      description: 'ค่าจัดส่งขั้นต่ำสำหรับระยะทาง 1-2 กม. (บาท)',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'delivery_distance_base_km',
      category: 'delivery',
      displayName: 'ระยะทางที่คิดค่าจัดส่งขั้นต่ำ (กม.)',
      description: 'ระยะทางที่คิดค่าจัดส่งขั้นต่ำ (กม.)',
      value: 2,
      valueType: 'number',
      minValue: 1,
      maxValue: 10
    },
    {
      key: 'delivery_fee_per_km',
      category: 'delivery',
      displayName: 'ค่าจัดส่งต่อกม. เมื่อเกินระยะทางขั้นต่ำ (บาท)',
      description: 'ค่าจัดส่งต่อกม. เมื่อเกินระยะทางขั้นต่ำ (บาท)',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 100
    },
    {
      key: 'shop_delivery_order_fee',
      category: 'delivery',
      displayName: 'ค่าธรรมเนียม Order ส่งที่บ้าน (Points)',
      description: 'จำนวน Points ที่ Shop ต้องจ่ายเมื่อ Rider รับงาน และ ร้านยืนยัน Order (ส่งที่บ้าน). ปรับได้จาก Admin',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'shop_dinein_daily_fee',
      category: 'delivery',
      displayName: 'ค่าธรรมเนียมกินที่ร้าน (Points/วัน)',
      description: 'จำนวน Points ที่ Shop ต้องจ่ายเมื่อจ่ายเงินรวมทั้งวันเกินเกณฑ์ (ครั้งเดียวต่อวัน, reset เที่ยงคืน). ปรับได้จาก Admin',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'shop_dinein_daily_threshold',
      category: 'delivery',
      displayName: 'เกณฑ์ยอดจ่ายเงินกินที่ร้าน (บาท/วัน)',
      description: 'เมื่อยอดจ่ายเงินกินที่ร้านรวมทั้งวันเกินค่านี้ ให้หักค่าธรรมเนียมกินที่ร้านครั้งเดียวต่อวัน',
      value: 300,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000000
    },
    {
      key: 'order_cancel_penalty_points',
      category: 'delivery',
      displayName: 'Points ที่หักเมื่อ Shop/Rider Cancel Order',
      description: 'จำนวน Points ที่จะหักจาก Shop หรือ Rider เมื่อ Cancel Order (แต่ Customer Cancel ไม่หัก)',
      value: 5,
      valueType: 'number',
      minValue: 0,
      maxValue: 1000
    },
    {
      key: 'partner_shop_commission_rate',
      category: 'delivery',
      displayName: 'อัตราค่าคอมมิชชั่น Partner Shop (%)',
      description: 'สัดส่วน Fee ที่ร้านจ่าย (points) ที่ให้ Partner Shop; ที่เหลือเป็น Platform. เช่น 20 = 20% ของ Fee ให้ Partner, 80% Platform. ปรับได้จาก Admin',
      value: 20,
      valueType: 'number',
      minValue: 0,
      maxValue: 100
    },

    // Reward Settings
    {
      key: 'new_user_welcome_reward_points',
      category: 'reward',
      displayName: 'รางวัลต้อนรับผู้ใช้ใหม่',
      description: 'จำนวน point ที่ผู้ใช้ใหม่ได้รับเมื่อสมัคร (points)',
      value: 500,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    {
      key: 'first_shop_reward_points',
      category: 'reward',
      displayName: 'รางวัลร้านค้าแรก',
      description: 'จำนวน point ที่ได้รับเมื่อสร้างร้านค้าแรก (points)',
      value: 500,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    {
      key: 'first_job_reward_points',
      category: 'reward',
      displayName: 'รางวัลเริ่มจ้างงานแรก',
      description: 'จำนวน point ที่ได้รับเมื่อเริ่มจ้างงานแรก (points)',
      value: 500,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    {
      key: 'new_partner_reward_points',
      category: 'reward',
      displayName: 'รางวัล Partner หน้าใหม่',
      description: 'จำนวน point ที่ได้รับเมื่อเป็น Partner หน้าใหม่ (points)',
      value: 500,
      valueType: 'number',
      minValue: 0,
      maxValue: 10000
    },
    // Point System Settings
    {
      key: 'point_conversion_rate',
      category: 'points',
      displayName: 'อัตราแลกเปลี่ยน Point (บาทต่อ Point)',
      description: 'จำนวนบาทที่เท่ากับ 1 Point (เช่น 1 = 1 บาทต่อ 1 Point, 0.5 = 0.5 บาทต่อ 1 Point)',
      value: 1,
      valueType: 'number',
      minValue: 0.01,
      maxValue: 100
    }
  ];
};

// Initialize default settings
questSettingsSchema.statics.initializeDefaults = async function() {
  const defaults = this.getDefaultSettings();
  const defaultKeys = defaults.map(s => s.key);
  
  // Deactivate settings that are no longer in defaults
  const deprecatedKeys = ['rider_cancel_penalty_points', 'customer_order_points_deduction'];
  for (const deprecatedKey of deprecatedKeys) {
    const existing = await this.findOne({ key: deprecatedKey });
    if (existing) {
      existing.isActive = false;
      await existing.save();
      console.log(`   🗑️ Deactivated deprecated setting: ${deprecatedKey}`);
    }
  }
  
  for (const setting of defaults) {
    // Check if setting exists
    const existing = await this.findOne({ key: setting.key });
    
    if (existing) {
      // Update description, valueType, minValue, maxValue, category, displayName if changed in defaults
      // But preserve value, lastModifiedBy if they were manually changed
      const updateFields = {
        description: setting.description,
        valueType: setting.valueType,
        minValue: setting.minValue,
        maxValue: setting.maxValue,
        displayName: setting.displayName,
        isActive: true // Ensure it's active
      };
      
      // Always update category if it changed (important for migration)
      if (existing.category !== setting.category) {
        updateFields.category = setting.category;
        console.log(`   🔄 Updating category for ${setting.key}: ${existing.category} → ${setting.category}`);
      }
      
      // Only update value if it hasn't been manually modified (no lastModifiedBy means it's still default)
      if (!existing.lastModifiedBy) {
        updateFields.value = setting.value;
      }
      
      await this.findOneAndUpdate(
        { key: setting.key },
        { $set: updateFields },
        { new: true }
      );
    } else {
      // Insert new setting
      await this.findOneAndUpdate(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true, new: true }
      );
    }
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
