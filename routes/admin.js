const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const SocialQuest = require('../models/SocialQuest');
const SocialQuestParticipation = require('../models/SocialQuestParticipation');
const QuestSettings = require('../models/QuestSettings');
const StreakSettings = require('../models/StreakSettings');
const Partner = require('../models/Partner');
const PointSystem = require('../models/PointSystem');
const PointTransaction = require('../models/PointTransaction');
const CashReward = require('../models/CashReward');
const Reward = require('../models/Reward');

/**
 * GET /api/v2/admin/dashboard
 * Get comprehensive admin dashboard data
 */
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    console.log('📊 Loading admin dashboard...');

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get user type breakdown
    const userTypeStats = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    // Get quest statistics
    const totalSocialQuests = await SocialQuest.countDocuments();
    const activeSocialQuests = await SocialQuest.countDocuments({
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
    // Quest statistics (no longer need pending quests since quests are active immediately)
    const expiredQuests = await SocialQuest.countDocuments({
      $or: [
        { status: 'expired' },
        { expiresAt: { $lt: new Date() } }
      ]
    });

    // Get quest template breakdown
    const questTemplateStats = await SocialQuest.aggregate([
      { $group: { _id: '$template', count: { $sum: 1 } } }
    ]);

    // Get participation statistics
    const totalParticipations = await SocialQuestParticipation.countDocuments();
    const pendingApprovals = await SocialQuestParticipation.countDocuments({ status: 'pending' });
    const approvedParticipations = await SocialQuestParticipation.countDocuments({ status: 'approved' });

    // Get recent pending participations for approval
    const pendingParticipationsForApproval = await SocialQuestParticipation.find({ status: 'pending' })
      .populate('participant', 'name email photo integrations')
      .populate('quest', 'title template pointsReward owner tiktokProfile tiktokShareUrl')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get total points in system
    const pointsStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          avgPoints: { $avg: '$points' },
          maxPoints: { $max: '$points' }
        }
      }
    ]);

    // Get recent activities (last 10 quest completions)
    const recentActivities = await SocialQuestParticipation.find({ status: 'approved' })
      .populate('participant', 'name email photo')
      .populate('quest', 'title template')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // Get current settings
    const settings = await QuestSettings.find({ isActive: true }).lean();

    const dashboardData = {
      // Overview Stats
      overview: {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        totalQuests: totalSocialQuests,
        activeQuests: activeSocialQuests,
        pendingParticipations: pendingApprovals,
        totalPending: pendingApprovals, // Only participations need approval now
        totalParticipations
      },

      // User Stats
      userStats: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        byType: userTypeStats.reduce((acc, item) => {
          acc[item._id || 'customer'] = item.count;
          return acc;
        }, {})
      },

      // Quest Stats
      questStats: {
        total: totalSocialQuests,
        active: activeSocialQuests,
        expired: expiredQuests,
        byTemplate: questTemplateStats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {})
      },

      // Participation Stats
      participationStats: {
        total: totalParticipations,
        pending: pendingApprovals,
        approved: approvedParticipations
      },

      // Points Stats
      pointsStats: pointsStats[0] || {
        totalPoints: 0,
        avgPoints: 0,
        maxPoints: 0
      },

      // Pending Approvals (only participations now, quests are active immediately)
      pendingApprovals: {
        quests: [], // No longer needed - quests are active immediately
        participations: pendingParticipationsForApproval.map(p => ({
          id: p._id,
          user: p.participant ? {
            name: p.participant.name,
            email: p.participant.email,
            photo: p.participant.photo,
            tiktokUsername: p.participant.integrations?.tiktok?.username || null
          } : null,
          quest: p.quest ? {
            id: p.quest._id,
            title: p.quest.title,
            template: p.quest.template,
            videoUrl: p.quest.tiktokShareUrl?.url || null, // Use tiktokShareUrl.url for video URL
            tiktokShareUrl: p.quest.tiktokShareUrl || null, // Include full tiktokShareUrl object
            tiktokProfile: p.quest.tiktokProfile || null
          } : null,
          proofUrl: p.verification?.proofUrl || null,
          commentLink: p.verification?.commentLink || null,
          createdAt: p.createdAt
        }))
      },

      // Recent Activities
      recentActivities: recentActivities.map(a => ({
        id: a._id,
        user: a.participant ? {
          name: a.participant.name,
          photo: a.participant.photo
        } : null,
        quest: a.quest ? {
          title: a.quest.title,
          template: a.quest.template
        } : null,
        completedAt: a.updatedAt
      })),

      // Current Settings
      settings: settings.reduce((acc, s) => {
        acc[s.key] = {
          value: s.value,
          displayName: s.displayName,
          category: s.category,
          valueType: s.valueType
        };
        return acc;
      }, {}),

      // Timestamp
      lastUpdated: new Date()
    };

    console.log('✅ Admin dashboard loaded');

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error loading admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการโหลดแดชบอร์ด'
    });
  }
});

/**
 * GET /api/v2/admin/quests/pending
 * Get all pending quests for approval
 */
router.get('/quests/pending', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pendingQuests = await SocialQuest.find({ status: 'pending' })
      .populate('owner', 'name email photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SocialQuest.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        quests: pendingQuests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pending quests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/quests/:questId/approve
 * Approve a pending quest
 */
router.post('/quests/:questId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { questId } = req.params;

    const quest = await SocialQuest.findByIdAndUpdate(
      questId,
      { 
        status: 'active',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    console.log(`✅ Quest ${questId} approved by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'เควสได้รับการอนุมัติแล้ว',
      data: quest
    });
  } catch (error) {
    console.error('Error approving quest:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/quests/:questId/reject
 * Reject a pending quest
 */
router.post('/quests/:questId/reject', auth, adminAuth, async (req, res) => {
  try {
    const { questId } = req.params;
    const { reason } = req.body;

    const quest = await SocialQuest.findById(questId);
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Refund points to owner
    if (quest.pointsCost > 0) {
      await User.findByIdAndUpdate(quest.owner, {
        $inc: { points: quest.pointsCost }
      });
    }

    // Update quest status
    quest.status = 'rejected';
    quest.rejectedBy = req.user.id;
    quest.rejectedAt = new Date();
    quest.rejectionReason = reason || 'ไม่ผ่านการอนุมัติ';
    await quest.save();

    console.log(`❌ Quest ${questId} rejected by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'เควสถูกปฏิเสธแล้ว คะแนนได้คืนให้ผู้สร้าง',
      data: quest
    });
  } catch (error) {
    console.error('Error rejecting quest:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/participations/pending
 * Get all pending participations for approval
 */
router.get('/participations/pending', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pendingParticipations = await SocialQuestParticipation.find({ status: 'pending' })
      .populate('participant', 'name email photo')
      .populate('quest', 'title template pointsReward owner tiktokProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SocialQuestParticipation.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        participations: pendingParticipations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pending participations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/participations/:participationId/approve
 * Approve a pending participation
 */
router.post('/participations/:participationId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { participationId } = req.params;

    const participation = await SocialQuestParticipation.findById(participationId)
      .populate('quest');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Participation not found'
      });
    }

    // Get quest owner, pointsReward, and pointsCost
    const questOwnerId = participation.quest?.owner;
    const pointsReward = participation.quest?.pointsReward || 1;
    const pointsCost = participation.quest?.pointsCost || 0;
    
    // Check how many approved participations exist BEFORE this approval
    const approvedCountBefore = await SocialQuestParticipation.countDocuments({
      quest: participation.quest._id,
      status: 'approved',
      _id: { $ne: participation._id }
    });
    
    const isFirstApproval = approvedCountBefore === 0;
    
    // Check if owner has enough points BEFORE approving
    if (questOwnerId) {
      const owner = await User.findById(questOwnerId);
      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Quest owner not found'
        });
      }
      
      // Calculate total points needed: pointsReward + pointsCost (if first approval)
      const totalPointsNeeded = pointsReward + (isFirstApproval ? pointsCost : 0);
      
      if (owner.points < totalPointsNeeded) {
        // Reject all pending participations for this quest automatically
        const pendingParticipations = await SocialQuestParticipation.find({
          quest: participation.quest._id,
          status: 'pending'
        });

        // Reject all pending participations
        for (const pending of pendingParticipations) {
          pending.status = 'denied';
          pending.verification.verifiedBy = req.user.id;
          pending.verification.verifiedAt = new Date();
          pending.verification.verificationNote = `ปฏิเสธอัตโนมัติ: Owner ไม่มีคะแนนพอ (มี ${owner.points} แต่ต้องการ ${totalPointsNeeded})`;
          await pending.save();
        }

        // Cancel the quest (set status to cancelled)
        await SocialQuest.findByIdAndUpdate(participation.quest._id, {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: `Owner ไม่มีคะแนนพอ (มี ${owner.points} แต่ต้องการ ${totalPointsNeeded})`
        });

        console.log(`🚫 Auto-rejected ${pendingParticipations.length} participations and cancelled quest ${participation.quest._id} due to insufficient owner points`);

        return res.status(400).json({
          success: false,
          message: `ไม่สามารถอนุมัติได้ เนื่องจาก Owner มีคะแนนไม่พอ (มี ${owner.points} แต่ต้องการ ${totalPointsNeeded}${isFirstApproval ? ` (รางวัล ${pointsReward} + ค่าใช้จ่าย ${pointsCost})` : ` (รางวัล ${pointsReward})`}). Quest ถูกยกเลิกอัตโนมัติและปฏิเสธการเข้าร่วมทั้งหมด (${pendingParticipations.length} รายการ)`,
          ownerPoints: owner.points,
          requiredPoints: totalPointsNeeded,
          pointsReward: pointsReward,
          pointsCost: isFirstApproval ? pointsCost : 0,
          autoRejectedCount: pendingParticipations.length,
          questCancelled: true
        });
      }
    }

    // Update participation status
    participation.status = 'approved';
    participation.verification.verifiedBy = req.user.id;
    participation.verification.verifiedAt = new Date();
    participation.pointsEarned = pointsReward;
    participation.pointsAwardedAt = new Date();
    await participation.save();

    // Complete daily quest if this participation is for a social quest in daily quests
    try {
        const DailyQuestService = require('../new-services/daily-quests/dailyQuestService');
        const virtualQuestId = `social_${participation.quest._id.toString()}`;
        const user = await User.findById(participation.participant);
        
        if (user && user.dailyQuestProgress && user.dailyQuestProgress.quests) {
            const questProgress = user.dailyQuestProgress.quests.find(
                qp => qp.questId && qp.questId.toString() === virtualQuestId
            );

            // ถ้ายังไม่ complete ให้ complete ทันที
            if (questProgress && !questProgress.completed) {
                questProgress.completed = true;
                questProgress.completedAt = new Date();
                questProgress.points = 1; // Social quest ใน daily quest ให้ 1 แต้ม

                // อัพเดท streak stats
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

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isFirstQuestOfDay = user.streakStats.dailyQuestsCompletedToday === 0;

                if (isFirstQuestOfDay) {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const lastQuestDate = user.streakStats.lastQuestDate
                        ? new Date(user.streakStats.lastQuestDate).setHours(0, 0, 0, 0)
                        : null;
                    const yesterdayStart = yesterday.getTime();

                    if (lastQuestDate === yesterdayStart) {
                        user.streakStats.currentStreak += 1;
                    } else if (lastQuestDate !== today.getTime()) {
                        user.streakStats.currentStreak = 1;
                    }
                }

                user.streakStats.dailyQuestsCompletedToday += 1;
                user.streakStats.totalQuestsCompleted += 1;
                user.streakStats.totalPointsEarned += 1;
                user.streakStats.lastQuestDate = new Date();
                user.points = (user.points || 0) + 1;
                user.dailyQuestProgress.isStreakMaintained = true;

                if (user.streakStats.currentStreak > user.streakStats.longestStreak) {
                    user.streakStats.longestStreak = user.streakStats.currentStreak;
                }

                await user.save();

                // Check and award streak milestone rewards
                const streakRewardService = require('../services/streakRewardService');
                await streakRewardService.checkAndAwardStreakMilestones(user._id, user.streakStats.currentStreak);
                console.log(`✅ Daily quest ${virtualQuestId} completed for user ${user._id} after participation approval`);
            }
        }
    } catch (error) {
        console.error('⚠️ Error completing daily quest after participation approval:', error);
        // Don't fail the approval if daily quest completion fails
    }

    // Deduct pointsReward from owner and give to participant (ทุกครั้งที่ approve)
    if (questOwnerId && pointsReward > 0) {
      // Deduct from owner
      await User.findByIdAndUpdate(questOwnerId, {
        $inc: { points: -pointsReward }
      });
      
      // Give to participant
      await User.findByIdAndUpdate(participation.participant, {
        $inc: { points: pointsReward }
      });
      
      console.log(`💰 Deducted ${pointsReward} points from quest owner ${questOwnerId} and gave to participant ${participation.participant}`);
    }

    // Deduct pointsCost from quest owner when first participation is approved (ค่าใช้จ่ายสร้าง quest)
    // Only deduct once when the first participation is approved
    if (isFirstApproval && questOwnerId && pointsCost > 0) {
      await User.findByIdAndUpdate(questOwnerId, {
        $inc: { points: -pointsCost }
      });
      console.log(`💰 Deducted ${pointsCost} points (quest cost) from quest owner ${questOwnerId} (first approval)`);
    }

    // Update quest participation count
    await SocialQuest.findByIdAndUpdate(participation.quest._id, {
      $inc: { currentParticipants: 1 }
    });

    // For follow quests: Save owner's TikTok username to participant's approvedFollowers list
    // This prevents creating duplicate follow quests for the same user
    if (participation.quest?.template === 'tiktok_follow' && questOwnerId) {
      // Get owner's TikTok username (the person being followed)
      const owner = await User.findById(questOwnerId)
        .select('integrations.tiktok.username');
      
      if (owner?.integrations?.tiktok?.username) {
        const ownerTiktokUsername = owner.integrations.tiktok.username.toLowerCase();
        
        // Get participant to add owner's username to their approvedFollowers list
        const participant = await User.findById(participation.participant);
        if (participant) {
          // Check if this username is already in participant's approvedFollowers
          const alreadyExists = participant.approvedFollowers?.some(
            f => f.tiktokUsername === ownerTiktokUsername
          );
          
          if (!alreadyExists) {
            // Add to participant's approvedFollowers list
            if (!participant.approvedFollowers) {
              participant.approvedFollowers = [];
            }
            participant.approvedFollowers.push({
              tiktokUsername: ownerTiktokUsername,
              approvedAt: new Date(),
              questId: participation.quest._id
            });
            await participant.save();
            console.log(`📝 Added @${ownerTiktokUsername} to participant's approvedFollowers list`);
          }
        }
      }
    }

    console.log(`✅ Participation ${participationId} approved, +${pointsReward} points`);

    res.json({
      success: true,
      message: `การเข้าร่วมได้รับการอนุมัติ (+${pointsReward} คะแนน)`,
      data: participation
    });
  } catch (error) {
    console.error('Error approving participation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/participations/:participationId/reject
 * Reject a pending participation
 */
router.post('/participations/:participationId/reject', auth, adminAuth, async (req, res) => {
  try {
    const { participationId } = req.params;
    const { reason } = req.body;

    const participation = await SocialQuestParticipation.findByIdAndUpdate(
      participationId,
      {
        status: 'denied',
        'verification.verifiedBy': req.user.id,
        'verification.verifiedAt': new Date(),
        'verification.verificationNote': reason || 'ไม่ผ่านการตรวจสอบ'
      },
      { new: true }
    );

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Participation not found'
      });
    }

    console.log(`❌ Participation ${participationId} rejected`);

    res.json({
      success: true,
      message: 'การเข้าร่วมถูกปฏิเสธ',
      data: participation
    });
  } catch (error) {
    console.error('Error rejecting participation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/settings
 * Get all quest settings (including QuestSettings and StreakSettings)
 */
router.get('/settings', auth, adminAuth, async (req, res) => {
  try {
    const { category } = req.query;

    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    // Get QuestSettings
    const questSettings = await QuestSettings.find(query)
      .sort({ category: 1, displayName: 1 })
      .lean();

    // Get StreakSettings
    const streakSettings = await StreakSettings.find(query)
      .sort({ key: 1 })
      .lean();

    // Combine all settings
    const allSettings = [...questSettings, ...streakSettings];

    // Group by category
    const groupedSettings = allSettings.reduce((acc, setting) => {
      const cat = setting.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        settings: groupedSettings,
        categories: ['points', 'quests', 'streak', 'social', 'system', 'job', 'reward']
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/v2/admin/settings/:key
 * Update a quest setting
 */
router.put('/settings/:key', auth, adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Try to find in QuestSettings first
    let setting = await QuestSettings.findOne({ key });
    let isStreakSetting = false;
    
    // If not found, try StreakSettings
    if (!setting) {
      setting = await StreakSettings.findOne({ key });
      isStreakSetting = true;
    }
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการตั้งค่านี้'
      });
    }
    
    // Handle boolean values from QuestSettings
    if (!isStreakSetting && setting.valueType === 'boolean') {
      // Convert value to boolean if needed
      const boolValue = typeof value === 'boolean' ? value : value === 1 || value === 'true' || value === true;
      setting.value = boolValue;
      await setting.save();
      
      return res.json({
        success: true,
        message: 'การตั้งค่าถูกบันทึกแล้ว',
        data: setting
      });
    }

    // Validate value based on type
    if (setting.valueType === 'number') {
      if (typeof value !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Value must be a number'
        });
      }
      if (setting.minValue !== null && value < setting.minValue) {
        return res.status(400).json({
          success: false,
          message: `Value must be at least ${setting.minValue}`
        });
      }
      if (setting.maxValue !== null && value > setting.maxValue) {
        return res.status(400).json({
          success: false,
          message: `Value must be at most ${setting.maxValue}`
        });
      }
    }

    // Check if it's a streak setting
    let updatedSetting;
    if (isStreakSetting || key.startsWith('streak_') || key.startsWith('default_reward_streak') || key.startsWith('minimum_streak')) {
      // Update StreakSettings
      updatedSetting = await StreakSettings.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { new: true }
      );
      
      if (!updatedSetting) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการตั้งค่านี้'
        });
      }
    } else {
      updatedSetting = await QuestSettings.updateSetting(key, value, req.user.id);
    }

    console.log(`⚙️ Setting ${key} updated to ${value} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'การตั้งค่าถูกบันทึกแล้ว',
      data: updatedSetting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/settings/initialize
 * Initialize default settings (only if not exists)
 */
router.post('/settings/initialize', auth, adminAuth, async (req, res) => {
  try {
    await QuestSettings.initializeDefaults();
    await StreakSettings.initializeDefaults();

    res.json({
      success: true,
      message: 'การตั้งค่าเริ่มต้นถูกสร้างแล้ว'
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/users
 * Get all users with pagination
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const userType = req.query.userType;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (userType) {
      query.userType = userType;
    }

    const users = await User.find(query)
      .select('name email photo userType points createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/v2/admin/users/:userId/role
 * Update user role
 */
router.put('/users/:userId/role', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.body;

    // Note: 'partner' is no longer a valid userType - partner status is determined by partnerId
    // Only allow changing to 'customer' or 'admin'
    if (!['customer', 'admin'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Valid types: customer, admin. Partner status is determined by partnerId.'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { userType },
      { new: true }
    ).select('name email userType partnerId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`👤 User ${userId} role changed to ${userType} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: `เปลี่ยน role เป็น ${userType} สำเร็จ`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/partner-registrations
 * Get all partner registrations (pending, approved, rejected)
 */
router.get('/partner-registrations', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query; // optional filter by status
    const query = status ? { status } : {};

    const partners = await Partner.find(query)
      .populate('userId', 'name email photo')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching partner registrations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/partner-registrations/:id
 * Get single partner registration details
 */
router.get('/partner-registrations/:id', auth, adminAuth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('userId', 'name email photo integrations')
      .populate('approvedBy', 'name email')
      .lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner registration not found'
      });
    }

    res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching partner registration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/v2/admin/partner-registrations/:id/approve
 * Approve partner registration
 */
router.post('/partner-registrations/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner registration not found'
      });
    }

    if (partner.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Partner registration is already ${partner.status}`
      });
    }

    // Generate partner code - ensure it's unique
    const generatePartnerCode = async () => {
      let code;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!isUnique && attempts < maxAttempts) {
        code = 'PT' + Math.floor(10000 + Math.random() * 90000).toString();
        const existing = await Partner.findOne({ partnerCode: code });
        if (!existing) {
          isUnique = true;
          console.log(`✅ Generated unique partnerCode: ${code} (attempt ${attempts + 1})`);
        } else {
          attempts++;
          console.log(`⚠️ PartnerCode ${code} already exists, trying again... (attempt ${attempts})`);
        }
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique partnerCode after maximum attempts');
      }
      
      return code;
    };

    const partnerCode = await generatePartnerCode();
    console.log(`🔍 Generated partnerCode for partner ${req.params.id}: ${partnerCode}`);

    // Update partner status to probation (ทดลองงาน)
    partner.status = 'probation';
    partner.probationStatus = 'active';
    partner.probationStartedAt = new Date();
    partner.partnerCode = partnerCode;
    partner.approvedAt = new Date();
    partner.approvedBy = req.user.id;
    await partner.save();

    // Update user: set partnerId and partnerCode, set userType to partner
    await User.findByIdAndUpdate(partner.userId, {
      partnerCode: partnerCode,
      partnerId: partner._id,
      userType: 'partner'
    });

    const updatedPartner = await Partner.findById(req.params.id)
      .populate('userId', 'name email photo')
      .populate('approvedBy', 'name email')
      .lean();

    console.log(`✅ Partner ${req.params.id} approved by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Partner registration approved successfully',
      data: updatedPartner
    });
  } catch (error) {
    console.error('Error approving partner registration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/partners
 * Get all partners (probation and approved)
 */
router.get('/partners', auth, adminAuth, async (req, res) => {
  try {
    const partners = await Partner.find({ 
      status: { $in: ['probation', 'approved'] } 
    })
      .populate('userId', 'name email photo')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('❌ Error getting all partners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get partners'
    });
  }
});

/**
 * POST /api/v2/admin/partners/:id/approve-probation
 * Approve probation (ผ่านทดลองงาน)
 */
router.post('/partners/:id/approve-probation', auth, adminAuth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    if (partner.status !== 'probation') {
      return res.status(400).json({
        success: false,
        message: `Partner is not in probation status. Current status: ${partner.status}`
      });
    }

    // Update partner: pass probation
    partner.status = 'approved';
    partner.probationStatus = 'passed';
    partner.probationPassedAt = new Date();
    partner.probationPassedBy = req.user.id;
    await partner.save();

    const updatedPartner = await Partner.findById(req.params.id)
      .populate('userId', 'name email photo')
      .populate('probationPassedBy', 'name email')
      .lean();

    console.log(`✅ Partner ${req.params.id} passed probation by admin ${req.user.id}`);

    return res.json({
      success: true,
      message: 'Partner passed probation successfully',
      data: updatedPartner
    });
  } catch (error) {
    console.error('❌ Error approving probation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve probation'
    });
  }
});

/**
 * DELETE /api/v2/admin/partners/:id
 * Delete a partner
 */
router.delete('/partners/:id', auth, adminAuth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Update user's partnerId if exists
    if (partner.userId) {
      await User.findByIdAndUpdate(partner.userId, {
        $unset: { partnerId: 1, partnerCode: 1 },
        userType: 'customer'
      });
    }

    // Delete partner
    await Partner.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting partner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete partner'
    });
  }
});

/**
 * POST /api/v2/admin/partner-registrations/:id/reject
 * Reject partner registration
 */
router.post('/partner-registrations/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner registration not found'
      });
    }

    if (partner.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Partner registration is already ${partner.status}`
      });
    }

    // Update partner status
    partner.status = 'rejected';
    partner.rejectedReason = reason || 'ไม่ผ่านการอนุมัติ';
    partner.approvedBy = req.user.id;
    await partner.save();

    const updatedPartner = await Partner.findById(req.params.id)
      .populate('userId', 'name email photo')
      .populate('approvedBy', 'name email')
      .lean();

    console.log(`❌ Partner ${req.params.id} rejected by admin ${req.user.id}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Partner registration rejected',
      data: updatedPartner
    });
  } catch (error) {
    console.error('Error rejecting partner registration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/v2/admin/point-system
 * Get point system information
 */
router.get('/point-system', auth, adminAuth, async (req, res) => {
  try {
    const pointSystem = await PointSystem.getSystem();
    
    // Get recent transactions
    const recentTransactions = await PointTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .lean();

    // Get statistics
    const totalTransactions = await PointTransaction.countDocuments();
    const totalClaimed = await PointTransaction.aggregate([
      { $match: { type: 'claim', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRefunded = await PointTransaction.aggregate([
      { $match: { type: 'refund', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return res.json({
      success: true,
      data: {
        ...pointSystem.toObject(),
        statistics: {
          totalTransactions,
          totalClaimed: totalClaimed[0]?.total || 0,
          totalRefunded: totalRefunded[0]?.total || 0
        },
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching point system:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch point system',
      error: error.message
    });
  }
});

/**
 * PUT /api/v2/admin/point-system
 * Update point system settings
 */
router.put('/point-system', auth, adminAuth, async (req, res) => {
  try {
    const { totalPoints, newUserPoints, touristQuestPoints } = req.body;
    const pointSystem = await PointSystem.getSystem();

    // Update total points if provided
    if (totalPoints !== undefined) {
      if (totalPoints < pointSystem.usedPoints) {
        return res.status(400).json({
          success: false,
          message: `Total points cannot be less than used points (${pointSystem.usedPoints})`
        });
      }
      pointSystem.totalPoints = totalPoints;
      pointSystem.availablePoints = Math.max(0, totalPoints - pointSystem.usedPoints);
    }

    // Update default values
    await pointSystem.updateDefaults(newUserPoints, touristQuestPoints, req.user._id);

    // Create transaction record
    await PointTransaction.create({
      type: 'admin_adjustment',
      amount: totalPoints !== undefined ? totalPoints - pointSystem.totalPoints : 0,
      description: 'Admin updated point system settings',
      adminId: req.user._id,
      pointSystemState: {
        totalPoints: pointSystem.totalPoints,
        usedPoints: pointSystem.usedPoints,
        availablePoints: pointSystem.availablePoints
      },
      status: 'completed'
    });

    return res.json({
      success: true,
      data: pointSystem,
      message: 'Point system updated successfully'
    });
  } catch (error) {
    console.error('Error updating point system:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update point system',
      error: error.message
    });
  }
});

/**
 * POST /api/v2/admin/point-system/add
 * Add points to the system
 */
router.post('/point-system/add', auth, adminAuth, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const pointSystem = await PointSystem.getSystem();
    await pointSystem.addPoints(amount, req.user._id);

    // Create transaction record
    await PointTransaction.create({
      type: 'admin_adjustment',
      amount: amount,
      description: description || 'Admin added points to system',
      adminId: req.user._id,
      pointSystemState: {
        totalPoints: pointSystem.totalPoints,
        usedPoints: pointSystem.usedPoints,
        availablePoints: pointSystem.availablePoints
      },
      status: 'completed'
    });

    return res.json({
      success: true,
      data: pointSystem,
      message: `Added ${amount} points to system`
    });
  } catch (error) {
    console.error('Error adding points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add points',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/point-system/transactions
 * Get point system transactions
 */
router.get('/point-system/transactions', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, userId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const transactions = await PointTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .populate('questId', 'name')
      .lean();

    const total = await PointTransaction.countDocuments(query);

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/cash-rewards
 * Get all cash reward redemptions
 */
router.get('/cash-rewards', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const cashRewards = await CashReward.find(query)
      .populate('user', 'name email')
      .sort({ requestedAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: cashRewards
    });
  } catch (error) {
    console.error('❌ Error getting cash rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/cash-rewards/:id/approve
 * Approve a cash reward redemption
 */
router.post('/cash-rewards/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const cashReward = await CashReward.findById(id);
    if (!cashReward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอถอนเงิน'
      });
    }

    if (cashReward.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `สถานะปัจจุบัน: ${cashReward.status} ไม่สามารถอนุมัติได้`
      });
    }

    cashReward.status = 'approved';
    await cashReward.save();

    console.log(`✅ Admin ${req.user.id} approved cash reward ${id}`);

    res.json({
      success: true,
      message: 'อนุมัติการถอนเงินแล้ว',
      data: cashReward
    });
  } catch (error) {
    console.error('❌ Error approving cash reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/cash-rewards/:id/pay
 * Mark cash reward as paid
 */
router.post('/cash-rewards/:id/pay', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const cashReward = await CashReward.findById(id);
    if (!cashReward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอถอนเงิน'
      });
    }

    if (cashReward.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `สถานะปัจจุบัน: ${cashReward.status} ไม่สามารถยืนยันการจ่ายได้`
      });
    }

    cashReward.status = 'paid';
    cashReward.paidAt = new Date();
    cashReward.paidBy = req.user.id;
    if (adminNotes) {
      cashReward.adminNotes = adminNotes;
    }
    await cashReward.save();

    console.log(`💰 Admin ${req.user.id} marked cash reward ${id} as paid`);

    res.json({
      success: true,
      message: 'ยืนยันการจ่ายเงินแล้ว',
      data: cashReward
    });
  } catch (error) {
    console.error('❌ Error marking cash reward as paid:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/cash-rewards/:id/reject
 * Reject a cash reward redemption
 */
router.post('/cash-rewards/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const cashReward = await CashReward.findById(id);
    if (!cashReward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอถอนเงิน'
      });
    }

    if (cashReward.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `สถานะปัจจุบัน: ${cashReward.status} ไม่สามารถปฏิเสธได้`
      });
    }

    // Refund points back to user
    const user = await User.findById(cashReward.user);
    if (user) {
      user.points = (user.points || 0) + cashReward.pointsUsed;
      await user.save();

      // Use points from system (since we're refunding, we need to use points from system)
      const pointSystem = await PointSystem.getSystem();
      await pointSystem.usePoints(cashReward.pointsUsed, cashReward.user);

      // Create PointTransaction for refund
      await PointTransaction.create({
        type: 'refund',
        amount: cashReward.pointsUsed,
        userId: cashReward.user,
        description: `Refund from rejected cash reward (${cashReward.amount} บาท)`,
        pointSystemState: {
          totalPoints: pointSystem.totalPoints,
          usedPoints: pointSystem.usedPoints,
          availablePoints: pointSystem.availablePoints
        },
        status: 'completed'
      });
    }

    cashReward.status = 'rejected';
    if (reason) {
      cashReward.adminNotes = reason;
    }
    await cashReward.save();

    console.log(`❌ Admin ${req.user.id} rejected cash reward ${id}`);

    res.json({
      success: true,
      message: 'ปฏิเสธการถอนเงินแล้ว (คะแนนถูกคืนให้ผู้ใช้แล้ว)',
      data: cashReward
    });
  } catch (error) {
    console.error('❌ Error rejecting cash reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/rewards
 * Get all rewards (admin only)
 */
router.get('/rewards', auth, adminAuth, async (req, res) => {
  try {
    const rewards = await Reward.find({}).sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('❌ Error getting rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * PUT /api/v2/admin/rewards/:rewardId
 * Update reward (admin only) - mainly for active/deactive
 */
router.put('/rewards/:rewardId', auth, adminAuth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const updateData = req.body;

    const reward = await Reward.findOne({ rewardId });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรางวัล'
      });
    }

    // Update reward
    if (updateData.active !== undefined) {
      reward.active = updateData.active;
    }
    if (updateData.name) {
      reward.name = updateData.name;
    }
    if (updateData.description) {
      reward.description = updateData.description;
    }
    if (updateData.pointsRequired !== undefined) {
      reward.pointsRequired = updateData.pointsRequired;
    }
    if (updateData.streakRequired !== undefined) {
      reward.streakRequired = updateData.streakRequired;
    }
    if (updateData.cashAmount !== undefined) {
      reward.cashAmount = updateData.cashAmount;
    }
    if (updateData.order !== undefined) {
      reward.order = updateData.order;
    }
    if (req.user?.id) {
      reward.lastModifiedBy = req.user.id;
    }

    await reward.save();

    res.json({
      success: true,
      message: 'อัปเดตรางวัลสำเร็จ',
      data: reward
    });
  } catch (error) {
    console.error('❌ Error updating reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

module.exports = router;
