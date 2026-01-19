const mongoose = require('mongoose');
const QuestSettings = require('../models/QuestSettings');
require('dotenv').config();

async function migrateRewardCategory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify');
    console.log('✅ Connected to MongoDB');

    const rewardKeys = [
      'new_user_welcome_reward_points',
      'first_shop_reward_points',
      'new_partner_reward_points'
    ];

    for (const key of rewardKeys) {
      const setting = await QuestSettings.findOne({ key });
      if (setting && setting.category !== 'reward') {
        const oldCategory = setting.category;
        setting.category = 'reward';
        await setting.save();
        console.log(`✅ Updated ${key}: ${oldCategory} → reward`);
      } else if (setting) {
        console.log(`ℹ️  ${key} already has category 'reward'`);
      } else {
        console.log(`⚠️  Setting ${key} not found`);
      }
    }

    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateRewardCategory();
