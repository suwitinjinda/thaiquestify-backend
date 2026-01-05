// นี่คือ entry point สำหรับบริการใหม่ทั้งหมด
// บริการเก่าอยู่ที่ service/ เหมือนเดิม ไม่ต้องเปลี่ยน

const streakService = require('./streak/streakService');
const dailyQuestService = require('./daily-quests/dailyQuestService');

// Export all new services
module.exports = {
    streak: streakService,
    dailyQuests: dailyQuestService,
    // Add other new services here as they're created
};