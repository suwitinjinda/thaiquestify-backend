// new-services/daily-quests/dailyQuestService.js
const User = require('../../models/User');
const DailyQuest = require('../../models/DailyQuest');
const StreakService = require('../streak/streakService');

class DailyQuestService {
    static async getTodaysQuests(userId) {
        try {
            console.log(`🔍 [DEBUG] Fetching today's quests for user: ${userId}`);

            // 🔧 ใช้ static method ของ Model
            const quests = await DailyQuest.getTodaysQuests();

            console.log(`📋 [DEBUG] Raw query result: ${quests.length} quests`);

            if (quests.length === 0) {
                console.log('⚠️ [DEBUG] No quests from getTodaysQuests()');

                // ลองหาแบบทั่วไป
                const allActiveQuests = await DailyQuest.find({ isActive: true });
                console.log(`📊 [DEBUG] All active quests: ${allActiveQuests.length}`);

                // ลองหาโดยไม่สนใจ availableDays
                const allQuests = await DailyQuest.find({});
                console.log(`📊 [DEBUG] Total quests in DB: ${allQuests.length}`);

                if (allQuests.length > 0) {
                    console.log('📝 [DEBUG] First quest details:', {
                        _id: allQuests[0]._id,
                        name: allQuests[0].name,
                        isActive: allQuests[0].isActive,
                        availableDays: allQuests[0].availableDays,
                        displayOrder: allQuests[0].displayOrder
                    });
                }
            }

            // ดึง user data
            const user = await User.findById(userId);

            if (!user) {
                console.log(`❌ User ${userId} not found`);
                throw new Error('User not found');
            }

            console.log(`👤 User found: ${user.name || user.email}`);

            // ตรวจสอบ dailyQuestProgress
            console.log(`📅 User dailyQuestProgress exists: ${!!user.dailyQuestProgress}`);

            // ตรวจสอบวันที่เพื่อ reset
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let progressDate = null;
            if (user.dailyQuestProgress && user.dailyQuestProgress.date) {
                const date = new Date(user.dailyQuestProgress.date);
                date.setHours(0, 0, 0, 0);
                progressDate = date.getTime();
            }

            const todayStart = today.getTime();

            console.log(`📆 Today timestamp: ${todayStart}, Progress date: ${progressDate}`);

            // Reset ถ้าวันเปลี่ยน
            if (progressDate !== todayStart) {
                console.log('🔄 Resetting daily progress for new day');
                user.dailyQuestProgress = {
                    date: new Date(),
                    quests: [],
                    isStreakMaintained: false
                };
                await user.save();
            }

            // Map quests กับ user progress
            const questsWithProgress = quests.map(quest => {
                // ตรวจสอบว่า quest นี้ user ทำเสร็จแล้วหรือยัง
                let isCompleted = false;
                let completedAt = null;
                let pointsEarned = null;

                if (user.dailyQuestProgress && user.dailyQuestProgress.quests) {
                    const questProgress = user.dailyQuestProgress.quests.find(
                        qp => qp.questId && qp.questId.toString() === quest._id.toString()
                    );

                    if (questProgress) {
                        isCompleted = questProgress.completed || false;
                        completedAt = questProgress.completedAt;
                        pointsEarned = questProgress.points;
                    }
                }

                // ตรวจสอบ availability
                const isAvailable = quest.isAvailableNow();

                return {
                    _id: quest._id,
                    name: quest.name,
                    description: quest.description,
                    points: quest.points,
                    icon: quest.icon,
                    requirements: quest.requirements,
                    questType: quest.questType,
                    action: quest.action,
                    isCompleted: isCompleted,
                    completed: isCompleted, // สำหรับ compatibility
                    completedAt: completedAt,
                    pointsEarned: pointsEarned,
                    isAvailable: isAvailable,
                    progress: isCompleted ? 'completed' : 'pending',
                    availableNow: isAvailable
                };
            });

            const completedCount = questsWithProgress.filter(q => q.isCompleted).length;
            const availableCount = questsWithProgress.filter(q => q.isAvailable).length;

            console.log(`✅ Prepared ${questsWithProgress.length} quests`);
            console.log(`🏁 Completed: ${completedCount}, Available: ${availableCount}`);

            return questsWithProgress;

        } catch (error) {
            console.error('❌ Error in getTodaysQuests:', error);
            console.error(error.stack);
            throw error;
        }
    }

    static async completeQuest(userId, questId) {
        try {
            console.log(`🎯 Completing quest ${questId} for user ${userId}`);

            // 1. ตรวจสอบ quest
            const quest = await DailyQuest.findById(questId);
            if (!quest) {
                throw new Error('Quest not found');
            }

            console.log(`📋 Quest found: ${quest.name}`);

            // 2. ตรวจสอบ user
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // 3. ตรวจสอบว่า quest ทำไปแล้วหรือยังวันนี้
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const progressDate = user.dailyQuestProgress?.date
                ? new Date(user.dailyQuestProgress.date).setHours(0, 0, 0, 0)
                : null;

            if (progressDate !== today.getTime()) {
                // ถ้าวันเปลี่ยน ให้ reset progress
                user.dailyQuestProgress = {
                    date: new Date(),
                    quests: [],
                    isStreakMaintained: false
                };
            }

            // ตรวจสอบว่า quest นี้ทำแล้วหรือยัง
            const alreadyCompleted = user.dailyQuestProgress?.quests?.some(
                q => q.questId && q.questId.toString() === questId.toString() && q.completed
            );

            if (alreadyCompleted) {
                throw new Error('Quest already completed today');
            }

            // 4. ตรวจสอบและ reset daily progress ถ้าจำเป็น
            await StreakService.checkAndResetDaily(userId);

            // 5. อัพเดท streak
            await user.save(); // save ก่อนเพื่อให้ checkAndResetDaily ทำงาน
            await StreakService.checkAndResetDaily(userId);
            await user.save(); // save อีกครั้งหลัง reset

            // 6. คำนวณคะแนน
            const currentStreak = user.streakStats?.currentStreak || 0;
            const streakMultiplier = StreakService.getStreakMultiplier(currentStreak);
            const pointsEarned = Math.floor(quest.points * streakMultiplier);

            console.log(`💰 Points: ${quest.points} × ${streakMultiplier} = ${pointsEarned}`);

            // 7. อัพเดท user stats
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
            }

            // ตรวจสอบว่าเป็น quest แรกของวันหรือไม่
            const isFirstQuestOfDay = user.streakStats.dailyQuestsCompletedToday === 0;

            // อัพเดท streak
            if (isFirstQuestOfDay) {
                // ถ้าเป็น quest แรกของวัน
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const lastQuestDate = user.streakStats.lastQuestDate
                    ? new Date(user.streakStats.lastQuestDate).setHours(0, 0, 0, 0)
                    : null;

                const yesterdayStart = yesterday.getTime();

                if (lastQuestDate === yesterdayStart) {
                    // ทำ streak ต่อเนื่อง
                    user.streakStats.currentStreak += 1;
                    console.log(`🔥 Streak continued: ${user.streakStats.currentStreak} days`);
                } else if (lastQuestDate === today.getTime()) {
                    // ทำ quest อีกครั้งในวันเดียวกัน
                    console.log(`🔄 Another quest today, streak unchanged`);
                } else {
                    // เริ่ม streak ใหม่
                    user.streakStats.currentStreak = 1;
                    console.log(`🌟 New streak started: ${user.streakStats.currentStreak} days`);
                }
            }

            // อัพเดท stats อื่นๆ
            user.streakStats.dailyQuestsCompletedToday += 1;
            user.streakStats.totalQuestsCompleted += 1;
            user.streakStats.totalPointsEarned += pointsEarned;
            user.streakStats.lastQuestDate = new Date();

            // อัพเดท longest streak
            if (user.streakStats.currentStreak > user.streakStats.longestStreak) {
                user.streakStats.longestStreak = user.streakStats.currentStreak;
            }

            // 8. อัพเดท daily progress
            if (!user.dailyQuestProgress) {
                user.dailyQuestProgress = {
                    date: new Date(),
                    quests: [],
                    isStreakMaintained: false
                };
            }

            // เพิ่มหรืออัพเดท quest progress
            const questProgress = user.dailyQuestProgress.quests.find(
                q => q.questId && q.questId.toString() === questId.toString()
            );

            if (questProgress) {
                questProgress.completed = true;
                questProgress.completedAt = new Date();
                questProgress.points = pointsEarned;
            } else {
                user.dailyQuestProgress.quests.push({
                    questId: questId,
                    completed: true,
                    completedAt: new Date(),
                    points: pointsEarned
                });
            }

            user.dailyQuestProgress.isStreakMaintained = true;

            // 9. เพิ่มไปยัง quest history
            if (!user.questHistory) {
                user.questHistory = [];
            }

            user.questHistory.push({
                questId: questId,
                completedAt: new Date(),
                points: pointsEarned,
                streakAtCompletion: user.streakStats.currentStreak
            });

            // 10. อัพเดท quest statistics
            quest.totalCompletions = (quest.totalCompletions || 0) + 1;
            quest.totalPointsGiven = (quest.totalPointsGiven || 0) + pointsEarned;

            // 11. บันทึกทุกอย่าง
            await Promise.all([
                user.save(),
                quest.save()
            ]);

            console.log(`✅ Quest completed successfully!`);
            console.log(`📊 Stats: ${pointsEarned} points, Streak: ${user.streakStats.currentStreak} days`);

            return {
                success: true,
                pointsEarned,
                streakMultiplier,
                newStreak: user.streakStats.currentStreak,
                isFirstQuestOfDay: isFirstQuestOfDay,
                totalPoints: user.streakStats.totalPointsEarned,
                message: `ทำเควสสำเร็จ! คุณได้รับ ${pointsEarned} คะแนน (Streak: ${user.streakStats.currentStreak} วัน)`,
                questStatus: {
                    questId: questId,
                    isCompleted: true,
                    completedAt: new Date(),
                    points: pointsEarned
                }
            };

        } catch (error) {
            console.error('❌ Error in completeQuest:', error);
            throw error;
        }
    }

    // ฟังก์ชันช่วยเหลือสำหรับการ seed ข้อมูลเริ่มต้น
    static async seedDefaultQuests() {
        try {
            const defaultQuests = [
                {
                    name: 'เช็คอินรายวัน',
                    description: 'เข้าใช้แอปทุกวันรับคะแนนพิเศษ',
                    points: 20,
                    icon: 'check_circle',
                    requirements: 'เข้าสู่ระบบในแอป',
                    questType: 'checkin',
                    action: 'app_open',
                    category: 'daily',
                    isActive: true,
                    order: 1
                },
                {
                    name: 'สำรวจเควสใหม่',
                    description: 'ดูเควสใหม่ 3 เควส',
                    points: 15,
                    icon: 'explore',
                    requirements: 'ดูรายละเอียดเควสใหม่ 3 เควส',
                    questType: 'explore',
                    action: 'quest_view',
                    category: 'daily',
                    isActive: true,
                    order: 2
                },
                {
                    name: 'ทำเควสสำเร็จ',
                    description: 'ทำเควสให้สำเร็จ 1 เควส',
                    points: 30,
                    icon: 'task_alt',
                    requirements: 'ทำเควสใดๆ ให้สำเร็จ 1 เควส',
                    questType: 'complete',
                    action: 'quest_complete',
                    category: 'daily',
                    isActive: true,
                    order: 3
                }
            ];

            // ลบ quests เก่า
            await DailyQuest.deleteMany({ category: 'daily' });

            // เพิ่ม quests ใหม่
            await DailyQuest.insertMany(defaultQuests);

            console.log(`✅ Seeded ${defaultQuests.length} default daily quests`);
            return defaultQuests;
        } catch (error) {
            console.error('❌ Error seeding default quests:', error);
            throw error;
        }
    }
}

module.exports = DailyQuestService;