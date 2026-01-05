const User = require('../../models/User');
const DailyQuest = require('../../models/DailyQuest');
const Achievement = require('../../models/Achievement');

class StreakService {
    // Methods for new streak system ONLY
    // ไม่กระทบโค้ดเก่า

    static async initializeUserStreak(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // ตรวจสอบว่า user มี streakStats หรือยัง (สำหรับ user เก่า)
            if (!user.streakStats) {
                user.streakStats = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastQuestDate: null,
                    totalQuestsCompleted: 0,
                    totalPointsEarned: 0,
                    dailyQuestsCompletedToday: 0,
                    lastResetDate: null
                };

                // Initialize other new fields if needed
                if (!user.questHistory) user.questHistory = [];
                if (!user.dailyQuestProgress) {
                    user.dailyQuestProgress = {
                        date: new Date(),
                        quests: [],
                        isStreakMaintained: false
                    };
                }

                await user.save();
            }

            return user.streakStats;
        } catch (error) {
            throw error;
        }
    }

    static async getStreakStats(userId) {
        try {
            await this.checkAndResetDaily(userId);

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            return {
                currentStreak: user.streakStats.currentStreak || 0,
                longestStreak: user.streakStats.longestStreak || 0,
                dailyCompleted: user.streakStats.dailyQuestsCompletedToday || 0,
                totalPoints: user.streakStats.totalPointsEarned || 0,
                nextReset: this.calculateNextReset(),
                multiplier: this.getStreakMultiplier(user.streakStats.currentStreak || 0)
            };
        } catch (error) {
            throw error;
        }
    }

    static async checkAndResetDaily(userId) {
        const user = await User.findById(userId);
        if (!user || !user.streakStats) return;

        const today = new Date().toDateString();
        const lastReset = user.streakStats.lastResetDate
            ? new Date(user.streakStats.lastResetDate).toDateString()
            : null;

        if (lastReset !== today) {
            user.streakStats.dailyQuestsCompletedToday = 0;
            user.streakStats.lastResetDate = new Date();
            user.dailyQuestProgress.date = new Date();
            user.dailyQuestProgress.quests = [];
            user.dailyQuestProgress.isStreakMaintained = false;

            await user.save();
        }
    }

    static calculateNextReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    }

    static getStreakMultiplier(streak) {
        if (streak >= 30) return 2.5;
        if (streak >= 14) return 2.0;
        if (streak >= 7) return 1.5;
        return 1.0;
    }

    // ... other new streak methods
}

module.exports = StreakService;