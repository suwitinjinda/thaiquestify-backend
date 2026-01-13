// new-services/daily-quests/dailyQuestService.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const DailyQuest = require('../../models/DailyQuest');
const StreakService = require('../streak/streakService');
const SocialQuest = require('../../models/SocialQuest');
const SocialQuestParticipation = require('../../models/SocialQuestParticipation');

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

            // Map quests กับ user progress (DailyQuest ปกติ)
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

                // สำหรับเควสเช็คอิน ให้แต้มพื้นฐาน = 1 เสมอ
                const basePoints = quest.questType === 'checkin' ? 1 : quest.points;

                return {
                    _id: quest._id,
                    name: quest.name,
                    description: quest.description,
                    points: basePoints,
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

            // ===== เพิ่ม Social Quests แบบสุ่มเข้าไปใน Daily Quests (สูงสุด 4 เควส / วัน / user) =====
            // แนวคิด: เลือก social quests สำหรับ user แต่ละวัน แล้ว "ล็อก" ไว้ใน dailyQuestProgress
            // เพื่อให้ refresh กี่ครั้ง ในวันเดียวกันชุด social quests จะไม่เปลี่ยน จนกว่าจะข้ามวันใหม่
            console.log('🔍 [SOCIAL_DAILY_DEBUG] Fetching social quests for daily mix...');

            // ใช้ selectedSocialQuests ที่เคยเลือกไว้ใน dailyQuestProgress ก่อน (ถ้ามี)
            let selectedSocialIds = [];
            if (user.dailyQuestProgress && Array.isArray(user.dailyQuestProgress.selectedSocialQuests)) {
                selectedSocialIds = user.dailyQuestProgress.selectedSocialQuests.map(id => id.toString());
            }

            console.log(`🔍 [SOCIAL_DAILY_DEBUG] Existing selected social IDs for today:`, selectedSocialIds);

            // ถ้ายังไม่มีเลือกไว้เลย ให้สุ่มเลือกตอนนี้ แล้วบันทึกลง dailyQuestProgress
            if (selectedSocialIds.length === 0) {
                // ดึง social quest ที่ active และไม่ใช่ของตัวเอง (owner != userId)
                const activeSocialQuests = await SocialQuest.find({
                    status: 'active',
                    owner: { $ne: userId },
                }).lean();
                console.log(`🔍 [SOCIAL_DAILY_DEBUG] Active social quests in DB (exclude self): ${activeSocialQuests.length}`);

                let socialDailyQuestsCandidates = [];

                if (activeSocialQuests.length > 0) {
                    const socialQuestIds = activeSocialQuests.map(q => q._id);

                    const participations = await SocialQuestParticipation.find({
                        quest: { $in: socialQuestIds },
                        participant: userId,
                    }).lean();

                    const participatedMap = new Set(participations.map(p => p.quest.toString()));

                    console.log(`🔍 [SOCIAL_DAILY_DEBUG] Participations for user ${userId}: ${participations.length}`);
                    console.log(`🔍 [SOCIAL_DAILY_DEBUG] Participated quest IDs:`, Array.from(participatedMap));

                    // กรองเฉพาะเควสที่ user ยังไม่เคยเข้าร่วม
                    let availableSocial = activeSocialQuests.filter(q => {
                        const sq = new SocialQuest(q);
                        const isActive = sq.isActive();
                        const hasJoined = participatedMap.has(q._id.toString());
                        if (!isActive) {
                            console.log(`⏹ [SOCIAL_DAILY_DEBUG] Social quest ${q._id} not active (status/expires/maxParticipants)`);
                        }
                        if (hasJoined) {
                            console.log(`👀 [SOCIAL_DAILY_DEBUG] User already participated social quest ${q._id}`);
                        }
                        return isActive && !hasJoined;
                    });

                    console.log(`🔍 [SOCIAL_DAILY_DEBUG] Available social quests for today (before shuffle): ${availableSocial.length}`);

                    // สุ่มลำดับแล้วเลือกสูงสุด 4 เควส
                    availableSocial = availableSocial.sort(() => 0.5 - Math.random());
                    const pickedSocial = availableSocial.slice(0, 4);
                    console.log(`🎲 [SOCIAL_DAILY_DEBUG] Picked social quests for today: ${pickedSocial.length}`);
                    if (pickedSocial.length > 0) {
                        console.log('[SOCIAL_DAILY_DEBUG] Picked IDs:', pickedSocial.map(q => q._id.toString()));
                    }

                    socialDailyQuestsCandidates = pickedSocial;
                    selectedSocialIds = pickedSocial.map(q => q._id.toString());
                }

                // บันทึก selectedSocialQuests ไว้ใน dailyQuestProgress เพื่อให้คงเดิมทั้งวัน
                if (!user.dailyQuestProgress) {
                    user.dailyQuestProgress = {
                        date: new Date(),
                        quests: [],
                        isStreakMaintained: false
                    };
                }
                user.dailyQuestProgress.selectedSocialQuests = selectedSocialIds;
                await user.save();

                console.log('💾 [SOCIAL_DAILY_DEBUG] Saved selected social quests for today:', selectedSocialIds);
            }

            // ตอนนี้ selectedSocialIds คือชุด social quest IDs วันนี้ (อาจว่างได้ถ้าไม่มี)
            // ⚠️ สำคัญ: ใช้ selectedSocialIds เสมอ (แม้ว่า user จะเข้าร่วมแล้ว) เพื่อให้ quest แสดงใน daily quest
            // Quest ที่ pending ควรแสดงอยู่จนกว่าจะ approved หรือ denied
            let socialDailyQuests = [];

            if (selectedSocialIds.length > 0) {
                // ใช้ selectedSocialIds ทั้งหมด แม้ว่า user จะเข้าร่วมแล้ว (pending/approved/denied)
                // เพราะ quest นี้เป็น daily quest ที่ต้องแสดงอยู่จนกว่าจะ complete
                const socialObjectIds = selectedSocialIds
                    .filter(id => mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));
                
                const selectedSocialQuests = await SocialQuest.find({
                    _id: { $in: socialObjectIds }
                    // ไม่กรอง status เพื่อให้แสดง quest ที่ pending หรือ cancel แล้วด้วย
                    // เพราะ quest นี้เป็น daily quest ที่ต้องแสดงอยู่จนกว่าจะ complete
                }).lean();

                console.log(`🔍 [SOCIAL_DAILY_DEBUG] Loaded ${selectedSocialQuests.length} selected social quests for today (from ${selectedSocialIds.length} saved IDs)`);

                // ตรวจสอบ participations ของ user สำหรับ social quests เหล่านี้
                const socialQuestIds = selectedSocialQuests.map(sq => sq._id);
                const participations = await SocialQuestParticipation.find({
                    quest: { $in: socialQuestIds },
                    participant: userId
                }).lean();

                const participationMap = {};
                participations.forEach(p => {
                    const questId = p.quest.toString();
                    participationMap[questId] = {
                        status: p.status,
                        createdAt: p.createdAt,
                        verifiedAt: p.verification?.verifiedAt
                    };
                });

                socialDailyQuests = selectedSocialQuests.map(sq => {
                    const virtualId = `social_${sq._id.toString()}`;
                    const participation = participationMap[sq._id.toString()];

                    // ตรวจสอบ progress เดิมใน dailyQuestProgress
                    let isCompleted = false;
                    let completedAt = null;
                    let pointsEarned = null;
                    let participationStatus = null;

                    // ตรวจสอบ participation status
                    if (participation) {
                        participationStatus = participation.status;
                        if (participation.status === 'approved') {
                            isCompleted = true;
                            completedAt = participation.verifiedAt || participation.createdAt;
                            pointsEarned = 1;
                        }
                    } else if (user.dailyQuestProgress && user.dailyQuestProgress.quests) {
                        const questProgress = user.dailyQuestProgress.quests.find(
                            qp => qp.questId && qp.questId.toString() === virtualId
                        );

                        if (questProgress) {
                            isCompleted = questProgress.completed || false;
                            completedAt = questProgress.completedAt;
                            pointsEarned = questProgress.points;
                        }
                    }

                    const progressValue = isCompleted ? 'completed' : (participationStatus === 'pending' ? 'pending_review' : 'pending');
                    
                    console.log(`📋 [SOCIAL_DAILY_DEBUG] Quest ${virtualId}: isCompleted=${isCompleted}, participationStatus=${participationStatus}, progress=${progressValue}, hasParticipated=${!!participation}`);

                    return {
                        _id: virtualId,
                        name: sq.title,
                        description: sq.description || '',
                        points: 1, // social quest ใน daily quest ให้ 1 แต้ม
                        icon: 'group',
                        requirements: 'เข้าร่วม Social Quest นี้ให้สำเร็จ',
                        questType: 'social',
                        action: 'social_quest',
                        isCompleted,
                        completed: isCompleted,
                        completedAt,
                        pointsEarned,
                        participationStatus: participationStatus || (participation ? 'pending' : null),
                        hasParticipated: !!participation,
                        isAvailable: true, // Always available - even when pending, it should stay visible
                        progress: progressValue,
                        availableNow: true,
                        // ข้อมูลเสริมสำหรับ frontend เพื่อให้สามารถเปิด TikTok link ได้
                        socialQuestRef: sq._id,
                        socialTemplate: sq.template,
                        tiktokProfile: sq.tiktokProfile || null,
                        tiktokShareUrl: sq.tiktokShareUrl || null,
                    };
                });
            }

            const allQuestsToday = [...questsWithProgress, ...socialDailyQuests];

            const completedCount = allQuestsToday.filter(q => q.isCompleted).length;
            const availableCount = allQuestsToday.filter(q => q.isAvailable).length;
            const pendingCount = allQuestsToday.filter(q => q.participationStatus === 'pending' || q.progress === 'pending_review').length;

            console.log(`✅ [DAILY_DEBUG] Prepared ${allQuestsToday.length} quests (daily + social)`);
            console.log(`    • Daily quests count: ${questsWithProgress.length}`);
            console.log(`    • Social quests mixed in: ${socialDailyQuests.length}`);
            console.log(`🏁 [DAILY_DEBUG] Completed: ${completedCount}, Available: ${availableCount}, Pending: ${pendingCount}`);
            
            // Log quests with pending status
            const pendingQuests = allQuestsToday.filter(q => q.participationStatus === 'pending' || q.progress === 'pending_review');
            if (pendingQuests.length > 0) {
                console.log(`📋 [DAILY_DEBUG] Pending quests details:`, pendingQuests.map(q => ({
                    id: q._id,
                    name: q.name,
                    participationStatus: q.participationStatus,
                    progress: q.progress,
                    isCompleted: q.isCompleted,
                    hasParticipated: q.hasParticipated
                })));
            }

            return allQuestsToday;

        } catch (error) {
            console.error('❌ Error in getTodaysQuests:', error);
            console.error(error.stack);
            throw error;
        }
    }

    static async completeQuest(userId, questId) {
        try {
            console.log(`🎯 Completing quest ${questId} for user ${userId}`);

            const questIdStr = questId.toString();
            const isSocialDaily = questIdStr.startsWith('social_');
            const socialQuestId = isSocialDaily ? questIdStr.replace('social_', '') : null;

            // 1. ตรวจสอบ quest (DailyQuest หรือ SocialQuest ผ่าน daily quest)
            let quest = null;
            if (isSocialDaily) {
                quest = await SocialQuest.findById(socialQuestId);
                if (!quest) {
                    throw new Error('Social quest not found');
                }
                console.log(`📋 Social Daily Quest found: ${quest.title}`);
            } else {
                quest = await DailyQuest.findById(questId);
                if (!quest) {
                    throw new Error('Quest not found');
                }
                console.log(`📋 Quest found: ${quest.name}`);
            }

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

            const targetQuestIdForProgress = isSocialDaily ? questIdStr : questId.toString();

            // ตรวจสอบว่า quest นี้ทำแล้วหรือยัง
            const alreadyCompleted = user.dailyQuestProgress?.quests?.some(
                q => q.questId && q.questId.toString() === targetQuestIdForProgress && q.completed
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

            // สำหรับเควสเช็คอิน และ Social Daily Quest ให้ได้ 1 คะแนนคงที่
            let pointsEarned;
            if (quest.questType === 'checkin' || isSocialDaily) {
                pointsEarned = 1;
            } else {
                pointsEarned = Math.floor(quest.points * streakMultiplier);
            }

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

            // 8. อัพเดทคะแนนรวมของระบบ (points หลัก)
            user.points = (user.points || 0) + pointsEarned;

            // 9. อัพเดท daily progress
            if (!user.dailyQuestProgress) {
                user.dailyQuestProgress = {
                    date: new Date(),
                    quests: [],
                    isStreakMaintained: false
                };
            }

            // เพิ่มหรืออัพเดท quest progress
            const questProgress = user.dailyQuestProgress.quests.find(
                q => q.questId && q.questId.toString() === targetQuestIdForProgress
            );

            if (questProgress) {
                questProgress.completed = true;
                questProgress.completedAt = new Date();
                questProgress.points = pointsEarned;
            } else {
                user.dailyQuestProgress.quests.push({
                    questId: targetQuestIdForProgress,
                    completed: true,
                    completedAt: new Date(),
                    points: pointsEarned
                });
            }

            user.dailyQuestProgress.isStreakMaintained = true;

            // 9. เพิ่มไปยัง quest history (เฉพาะ quests ที่มี ObjectId จริง ไม่ใช่ social quests)
            // สำหรับ social quests เราไม่ต้องเก็บใน questHistory เพราะมันไม่ใช่ Quest object
            if (!isSocialDaily && !user.questHistory) {
                user.questHistory = [];
            }

            // เพิ่ม questHistory เฉพาะ quests ที่ไม่ใช่ social quests
            // เพราะ social quests ใช้ String ID (social_xxx) แต่ questHistory ต้องการ ObjectId
            if (!isSocialDaily) {
                user.questHistory.push({
                    questId: quest._id, // ใช้ ObjectId จริงจาก quest object
                    completedAt: new Date(),
                    points: pointsEarned,
                    streakAtCompletion: user.streakStats.currentStreak
                });
            }

            // 10. อัพเดท quest statistics (เฉพาะ DailyQuest ปกติ)
            if (!isSocialDaily) {
                quest.totalCompletions = (quest.totalCompletions || 0) + 1;
                quest.totalPointsGiven = (quest.totalPointsGiven || 0) + pointsEarned;
            }

            // 11. ตรวจสอบ bonus ถ้าทำครบทุกเควสของวันนี้
            const todaysQuests = await this.getTodaysQuests(userId);
            const totalQuestsToday = todaysQuests.length;
            const completedToday = user.dailyQuestProgress.quests.filter(q => q.completed).length;

            let bonusEarned = 0;
            if (totalQuestsToday > 0 && completedToday >= totalQuestsToday) {
                bonusEarned = 5;
                user.points = (user.points || 0) + bonusEarned;
                user.streakStats.totalPointsEarned += bonusEarned;
                console.log(`🎉 All daily quests completed! Bonus +${bonusEarned} points awarded.`);
            }

            // 12. บันทึกทุกอย่าง
            if (!isSocialDaily) {
                await Promise.all([
                    user.save(),
                    quest.save()
                ]);
            } else {
                await user.save();
            }

            console.log(`✅ Quest completed successfully!`);
            console.log(`📊 Stats: ${pointsEarned} points, Streak: ${user.streakStats.currentStreak} days`);

            return {
                success: true,
                pointsEarned,
                bonusEarned,
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