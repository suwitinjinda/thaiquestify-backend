const mongoose = require('mongoose');
const DailyQuest = require('../models/DailyQuest');
const config = require('../config/database');

const newDailyQuests = [
    {
        name: 'เช็คอินรายวัน',
        description: 'เข้าใช้แอปทุกวันรับคะแนนพิเศษ',
        questType: 'checkin',
        points: 20,
        icon: 'check_circle',
        requirements: 'เข้าสู่ระบบในแอป',
        action: 'app_open',
        actionCount: 1,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '00:00',
        endTime: '23:59',
        displayOrder: 1,
        isActive: true
    },
    {
        name: 'สำรวจเควสใหม่',
        description: 'ดูเควสใหม่ 3 เควส',
        questType: 'explore',
        points: 15,
        icon: 'explore',
        requirements: 'ดูรายละเอียดเควสใหม่',
        action: 'quest_view',
        actionCount: 3,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        displayOrder: 2,
        isActive: true
    },
    {
        name: 'ทำเควสสำเร็จ',
        description: 'ทำเควสให้สำเร็จ 1 เควส',
        questType: 'complete',
        points: 30,
        icon: 'task_alt',
        requirements: 'ทำเควสใดๆ ให้สำเร็จ',
        action: 'quest_complete',
        actionCount: 1,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        displayOrder: 3,
        isActive: true
    }
];

const seedNewDailyQuests = async () => {
    try {
        await mongoose.connect(config.database, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB for seeding NEW daily quests');

        // ใส่ daily quests ใหม่ (ไม่ลบของเก่า ถ้ามี)
        for (const questData of newDailyQuests) {
            const existing = await DailyQuest.findOne({ name: questData.name });

            if (!existing) {
                const quest = new DailyQuest(questData);
                await quest.save();
                console.log(`Added new daily quest: ${questData.name}`);
            } else {
                console.log(`Daily quest already exists: ${questData.name}`);
            }
        }

        // แสดงรายการ daily quests ทั้งหมด
        const allQuests = await DailyQuest.find({});
        console.log(`\nTotal daily quests in database: ${allQuests.length}`);
        allQuests.forEach(quest => {
            console.log(`- ${quest.name} (${quest.points} points) - Active: ${quest.isActive}`);
        });

        mongoose.disconnect();
        console.log('\nSeeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding new daily quests:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seedNewDailyQuests();