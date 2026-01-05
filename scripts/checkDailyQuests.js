// scripts/checkDailyQuests.js
const mongoose = require('mongoose');

async function checkDailyQuests() {
    try {
        await mongoose.connect('mongodb://questadmin:Vios399%40dm1n@localhost:27017/thaiquestify?authSource=thaiquestify');

        const DailyQuest = require('../models/DailyQuest');

        // ตรวจสอบจำนวน documents
        const count = await DailyQuest.countDocuments();
        console.log(`📊 Total DailyQuests in database: ${count}`);

        // แสดงข้อมูลทั้งหมด
        const quests = await DailyQuest.find({});
        console.log('\n📋 All Daily Quests:');
        quests.forEach((quest, index) => {
            console.log(`${index + 1}. ${quest.name} - ${quest.points} points (Active: ${quest.isActive})`);
        });

        // ตรวจสอบ active quests
        const activeQuests = await DailyQuest.find({ isActive: true });
        console.log(`\n✅ Active Daily Quests: ${activeQuests.length}`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkDailyQuests();