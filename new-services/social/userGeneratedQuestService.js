// new-services/social/userGeneratedQuestService.js
// Service สำหรับจัดการ Job Postings (งาน/รับจ้าง)
// Collection: 'jobpostings' - แยกจาก 'socialquests' (เควสจากชุมชน)
const UserGeneratedQuest = require('../../models/UserGeneratedQuest');
const UserQuestParticipation = require('../../models/UserQuestParticipation');
const User = require('../../models/User');

class UserGeneratedQuestService {

    // สร้าง quest ใหม่
    async createQuest(userId, questData) {
        try {
            console.log('Creating quest for user:', userId, 'data:', questData);

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // คำนวณ expiredAt
            const expiredAt = new Date();
            expiredAt.setDate(expiredAt.getDate() + (questData.settings?.durationDays || 7));

            // สร้าง quest
            // ใช้ status จาก questData หรือ 'active' ถ้าไม่ระบุ (สำหรับ job posting ให้เป็น active ทันที)
            const quest = new UserGeneratedQuest({
                ...questData,
                creator: userId,
                status: questData.status || 'active', // ใช้ status จาก request หรือ default เป็น 'active'
                expiredAt: expiredAt
            });

            await quest.save();
            return quest;
        } catch (error) {
            console.error('Error creating quest:', error);
            throw error;
        }
    }

    // ดึง quests สำหรับแสดงใน Landing Page
    async getPublicQuests(userId, filters = {}) {
        try {
            const { page = 1, limit = 10 } = filters;

            const query = {
                status: 'active',
                'settings.isPublic': true,
                expiredAt: { $gt: new Date() }
            };

            const quests = await UserGeneratedQuest.find(query)
                .populate('creator', 'name photo')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            return {
                quests,
                pagination: {
                    page,
                    limit,
                    total: await UserGeneratedQuest.countDocuments(query)
                }
            };
        } catch (error) {
            console.error('Error getting public quests:', error);
            throw error;
        }
    }

    // ผู้ใช้เข้าร่วม quest
    async joinQuest(userId, questId) {
        try {
            const quest = await UserGeneratedQuest.findById(questId);
            if (!quest) throw new Error('Quest not found');

            if (quest.status !== 'active') {
                throw new Error('Quest is not active');
            }

            if (new Date(quest.expiredAt) < new Date()) {
                throw new Error('Quest has expired');
            }

            // ตรวจสอบว่าเข้าร่วมแล้วหรือยัง
            const existingParticipation = await UserQuestParticipation.findOne({
                user: userId,
                quest: questId
            });

            if (existingParticipation) {
                throw new Error('Already joined this quest');
            }

            // สร้าง participation record
            const participation = new UserQuestParticipation({
                user: userId,
                quest: questId,
                progress: {
                    current: 0,
                    target: quest.target
                },
                status: 'joined'
            });

            await participation.save();

            // อัพเดท quest stats
            quest.stats.totalParticipants += 1;
            await quest.save();

            return participation;
        } catch (error) {
            console.error('Error joining quest:', error);
            throw error;
        }
    }

    // ส่งการยืนยัน quest
    async submitVerification(userId, questId, verificationData) {
        try {
            const participation = await UserQuestParticipation.findOne({
                user: userId,
                quest: questId
            });

            if (!participation) {
                throw new Error('Participation not found');
            }

            participation.verification = {
                ...verificationData,
                submittedAt: new Date()
            };
            participation.status = 'pending_verification';

            await participation.save();

            return { status: 'pending_verification', message: 'Verification submitted successfully' };
        } catch (error) {
            console.error('Error submitting verification:', error);
            throw error;
        }
    }

    // ดึง quests ที่ผู้ใช้สร้าง
    async getUserCreatedQuests(userId) {
        try {
            const quests = await UserGeneratedQuest.find({ creator: userId })
                .sort({ createdAt: -1 });

            return quests;
        } catch (error) {
            console.error('Error getting user created quests:', error);
            throw error;
        }
    }

    // ดึง quests ที่ผู้ใช้เข้าร่วม
    async getUserParticipations(userId) {
        try {
            const participations = await UserQuestParticipation.find({ user: userId })
                .populate('quest')
                .sort({ joinedAt: -1 });

            return participations;
        } catch (error) {
            console.error('Error getting user participations:', error);
            throw error;
        }
    }

    // ตรวจสอบและอัพเดท quests ที่หมดอายุ
    async checkAndUpdateExpiredQuests() {
        try {
            const expiredQuests = await UserGeneratedQuest.updateMany(
                {
                    status: 'active',
                    expiredAt: { $lt: new Date() }
                },
                {
                    $set: { status: 'expired' }
                }
            );

            console.log(`Updated ${expiredQuests.modifiedCount} expired quests`);
            return expiredQuests;
        } catch (error) {
            console.error('Error updating expired quests:', error);
            throw error;
        }
    }
}

// ส่งออก instance ของ service
module.exports = new UserGeneratedQuestService();