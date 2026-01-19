// scripts/initializeRewards.js
// Initialize default rewards in the database

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Reward = require('../models/Reward');

const defaultRewards = [
  {
    rewardId: 'streak_7',
    name: 'รางวัล Streak 7 วัน',
    description: 'รับ 10 คะแนนเมื่อทำ streak 7 วัน',
    category: 'streak',
    pointsRequired: 0,
    streakRequired: 7,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 1
  },
  {
    rewardId: 'streak_14',
    name: 'รางวัล Streak 14 วัน',
    description: 'รับ 50 คะแนนเมื่อทำ streak 14 วัน',
    category: 'streak',
    pointsRequired: 0,
    streakRequired: 14,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 2
  },
  {
    rewardId: 'streak_30',
    name: 'รางวัล Streak 30 วัน',
    description: 'รับ 100 คะแนนเมื่อทำ streak 30 วัน',
    category: 'streak',
    pointsRequired: 0,
    streakRequired: 30,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 3
  },
  {
    rewardId: 'new_user_welcome_reward',
    name: 'รางวัลต้อนรับผู้ใช้ใหม่',
    description: 'รับคะแนนต้อนรับเมื่อสมัครใหม่ (ภายใน 30 วัน)',
    category: 'milestone',
    pointsRequired: 0,
    streakRequired: null,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 4
  },
  {
    rewardId: 'first_shop_reward',
    name: 'รางวัลร้านค้าแรก',
    description: 'รับคะแนนเมื่อสร้างร้านค้าแรก',
    category: 'milestone',
    pointsRequired: 0,
    streakRequired: null,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 5
  },
  {
    rewardId: 'new_partner_reward',
    name: 'รางวัล Partner หน้าใหม่',
    description: 'รับคะแนนเมื่อเป็น Partner หน้าใหม่',
    category: 'milestone',
    pointsRequired: 0,
    streakRequired: null,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 6
  },
  {
    rewardId: 'first_job_reward',
    name: 'รางวัลเริ่มจ้างงานแรก',
    description: 'รับคะแนนเมื่อเริ่มจ้างงานแรก',
    category: 'milestone',
    pointsRequired: 0,
    streakRequired: null,
    cashAmount: null,
    isMilestone: true,
    active: true,
    order: 7
  },
  {
    rewardId: 'cash_300',
    name: 'เงินสด 300 บาท',
    description: 'แลกเงินสด 300 บาท (ต้องมี streak 30 วัน)',
    category: 'cash',
    pointsRequired: 500,
    streakRequired: 30, // เพิ่ม condition streak 30 วัน
    cashAmount: 300,
    isMilestone: false,
    active: true,
    order: 8
  }
];

async function initializeRewards() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing rewards
    const existingCount = await Reward.countDocuments();
    console.log(`📊 Existing rewards: ${existingCount}`);

    // Initialize each reward (upsert)
    for (const rewardData of defaultRewards) {
      const existing = await Reward.findOne({ rewardId: rewardData.rewardId });
      
      if (existing) {
        // Update existing reward (preserve active status if manually changed)
        const wasManuallyChanged = existing.lastModifiedBy !== null && existing.lastModifiedBy !== undefined;
        
        if (!wasManuallyChanged) {
          // Only update if not manually changed
          existing.name = rewardData.name;
          existing.description = rewardData.description;
          existing.category = rewardData.category;
          existing.pointsRequired = rewardData.pointsRequired;
          existing.streakRequired = rewardData.streakRequired;
          existing.cashAmount = rewardData.cashAmount;
          existing.isMilestone = rewardData.isMilestone;
          existing.order = rewardData.order;
          // Keep existing active status
          await existing.save();
          console.log(`✅ Updated reward: ${rewardData.rewardId}`);
        } else {
          console.log(`⏭️  Skipped ${rewardData.rewardId} (manually modified)`);
        }
      } else {
        // Create new reward
        await Reward.create(rewardData);
        console.log(`✅ Created reward: ${rewardData.rewardId}`);
      }
    }

    const finalCount = await Reward.countDocuments();
    console.log(`\n🎉 Initialization complete! Total rewards: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing rewards:', error);
    process.exit(1);
  }
}

initializeRewards();
