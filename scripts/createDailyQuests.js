const mongoose = require('mongoose');
const DailyQuest = require('../models/DailyQuest');

async function createDailyQuests() {
  console.log('🔗 Connecting to MongoDB for daily quests seeding...');

  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1) Check-in quest (เปิดแอป/เช็คอินรายวัน)
    const checkinQuestDef = {
      name: 'เช็คอินรายวัน',
      description: 'เปิดแอปและเช็คอิน 1 ครั้งต่อวัน เพื่อรักษา Streak และรับคะแนน',
      questType: 'checkin',
      points: 1,
      icon: 'check-circle',
      requirements: 'เปิดแอปอย่างน้อย 1 ครั้งในวันนี้',
      action: 'app_open',
      actionCount: 1,
      availableDays: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
      startTime: '00:00',
      endTime: '23:59',
      isActive: true,
      displayOrder: 1,
    };

    const existingCheckin = await DailyQuest.findOne({
      questType: 'checkin',
      action: 'app_open',
    });

    if (existingCheckin) {
      console.log('ℹ️ Check-in quest already exists:', existingCheckin._id.toString());
    } else {
      const created = await DailyQuest.create(checkinQuestDef);
      console.log('✅ Created check-in quest:', created._id.toString());
    }

    // (Optional) You can add more default daily quests here later

    console.log('✨ Daily quests seeding completed.');
  } catch (err) {
    console.error('❌ Error seeding daily quests:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

createDailyQuests();

