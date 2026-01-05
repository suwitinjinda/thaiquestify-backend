// scripts/seedDailyQuests.js
const mongoose = require('mongoose');
const DailyQuest = require('../models/DailyQuest');

// ใช้ encodeURIComponent สำหรับ password ที่มี @
const username = 'questadmin';
const password = encodeURIComponent('Vios399@dm1n');
const MONGODB_URI = `mongodb://${username}:${password}@localhost:27017/thaiquestify?authSource=thaiquestify`;

const sampleDailyQuests = [
    {
        name: 'เช็คอินรายวัน',
        description: 'เข้าใช้แอปทุกวันรับคะแนนพิเศษ',
        points: 20,
        icon: 'check_circle',
        requirements: 'เข้าสู่ระบบในแอป',
        action: 'app_open',
        actionCount: 1,
        questType: 'checkin',
        isActive: true,
        displayOrder: 1,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    },
    {
        name: 'สำรวจเควสใหม่',
        description: 'ดูเควสใหม่ 3 เควส',
        points: 15,
        icon: 'explore',
        requirements: 'ดูรายละเอียดเควสใหม่ 3 เควส',
        action: 'quest_view',
        actionCount: 3,
        questType: 'explore',
        isActive: true,
        displayOrder: 2,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    },
    {
        name: 'ทำเควสสำเร็จ',
        description: 'ทำเควสให้สำเร็จ 1 เควส',
        points: 30,
        icon: 'task_alt',
        requirements: 'ทำเควสใดๆ ให้สำเร็จ 1 เควส',
        action: 'quest_complete',
        actionCount: 1,
        questType: 'complete',
        isActive: true,
        displayOrder: 3,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    },
    {
        name: 'แชร์บนโซเชียล',
        description: 'แชร์เควสบน Facebook หรือ Instagram',
        points: 25,
        icon: 'share',
        requirements: 'แชร์ภาพหรือลิงก์บนโซเชียลมีเดีย',
        action: 'share_social',
        actionCount: 1,
        questType: 'share',
        isActive: true,
        displayOrder: 4,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    },
    {
        name: 'ให้คะแนนร้านค้า',
        description: 'ให้คะแนนร้านค้าที่ทำเควส',
        points: 20,
        icon: 'star',
        requirements: 'ให้คะแนนร้านค้า 1 ร้าน',
        action: 'rate_shop',
        actionCount: 1,
        questType: 'rate',
        isActive: true,
        displayOrder: 5,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    },
    {
        name: 'เชิญเพื่อน',
        description: 'เชิญเพื่อนมาใช้แอป',
        points: 50,
        icon: 'person_add',
        requirements: 'ส่งลิงก์เชิญให้เพื่อน',
        action: 'invite_friend',
        actionCount: 1,
        questType: 'social',
        isActive: true,
        displayOrder: 6,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59'
    }
];

async function seedDailyQuests() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        console.log('Using URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000
        });

        console.log('✅ Connected to MongoDB successfully!');
        console.log('Database:', mongoose.connection.name);

        // ตรวจสอบ collection
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        console.log('📊 Collections:', collectionNames);

        // ลบข้อมูลเก่าใน collection dailyquests
        if (collectionNames.includes('dailyquests')) {
            console.log('🗑️  Clearing existing daily quests...');
            await mongoose.connection.db.collection('dailyquests').deleteMany({});
            console.log('✅ Cleared existing daily quests');
        }

        console.log('✨ Adding sample daily quests...');
        const createdQuests = await DailyQuest.insertMany(sampleDailyQuests);
        console.log(`✅ Successfully added ${createdQuests.length} daily quests`);

        // แสดงข้อมูล
        console.log('\n📋 Daily Quests added:');
        createdQuests.forEach((quest, index) => {
            console.log(`${index + 1}. ${quest.name} - ${quest.points} points (${quest.questType})`);
        });

        // ทดสอบฟังก์ชัน getTodaysQuests
        console.log('\n🧪 Testing getTodaysQuests()...');
        const todaysQuests = await DailyQuest.getTodaysQuests();
        console.log(`📅 Today's available quests: ${todaysQuests.length} quests`);
        todaysQuests.forEach((quest, index) => {
            console.log(`   ${index + 1}. ${quest.name} - Available: ${quest.isAvailableNow() ? '✅' : '❌'}`);
        });

        console.log('\n✨ Seed process completed successfully!');

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error name:', error.name);

        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
        }

        process.exit(1);
    }
}

// รัน seed
seedDailyQuests();