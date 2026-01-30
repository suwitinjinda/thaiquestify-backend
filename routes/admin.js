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
const ShopFeeSplitRecord = require('../models/ShopFeeSplitRecord');
const Reward = require('../models/Reward');
const Rider = require('../models/Rider');
const Delivery = require('../models/Delivery');
const mongoose = require('mongoose');
const { getSignedUrl } = require('../utils/gcpStorage');

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
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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

    // Create PointTransaction records so การหัก and รางวัลทำ quest follow tiktok สำเร็จ appear in point history
    if (questOwnerId || participation.participant) {
      const [ownerAfter, participantAfter] = await Promise.all([
        questOwnerId ? User.findById(questOwnerId).select('points').lean() : null,
        participation.participant ? User.findById(participation.participant).select('points').lean() : null
      ]);
      const ownerPoints = ownerAfter?.points ?? 0;
      const participantPoints = participantAfter?.points ?? 0;

      const txPromises = [];

      // 1) Owner – การหัก รางวัลให้ผู้ทำ quest (ทุกครั้งที่ approve)
      if (questOwnerId && pointsReward > 0) {
        const ownerBalanceAfterRewardDeduction = ownerPoints + (isFirstApproval && pointsCost > 0 ? pointsCost : 0);
        txPromises.push(
          PointTransaction.create({
            userId: questOwnerId,
            type: 'deduction',
            amount: -pointsReward,
            description: 'รางวัล TikTok follow quest ให้ผู้ทำ quest สำเร็จ',
            relatedId: participation._id,
            relatedModel: null,
            remainingPoints: ownerBalanceAfterRewardDeduction
          })
        );
      }

      // 2) Owner – การหัก ค่าธรรมเนียมสร้าง quest (ครั้งแรกที่ approve เท่านั้น)
      if (isFirstApproval && questOwnerId && pointsCost > 0) {
        txPromises.push(
          PointTransaction.create({
            userId: questOwnerId,
            type: 'deduction',
            amount: -pointsCost,
            description: 'ค่าธรรมเนียมสร้าง TikTok follow quest',
            relatedId: participation.quest?._id || participation._id,
            relatedModel: null,
            remainingPoints: ownerPoints
          })
        );
      }

      // 3) Participant – คนที่ทำ quest follow tiktok สำเร็จ
      if (pointsReward > 0 && participation.participant) {
        txPromises.push(
          PointTransaction.create({
            userId: participation.participant,
            type: 'reward',
            amount: pointsReward,
            description: 'รางวัลทำ TikTok follow quest สำเร็จ',
            relatedId: participation._id,
            relatedModel: null,
            remainingPoints: participantPoints
          })
        );
      }

      if (txPromises.length) {
        await Promise.all(txPromises);
        console.log(`📋 Created ${txPromises.length} PointTransaction(s) for TikTok follow quest approval`);
      }
    }

    // Update quest participation count
    const updatedQuest = await SocialQuest.findByIdAndUpdate(
      participation.quest._id,
      { $inc: { currentParticipants: 1 } },
      { new: true }
    ).lean();
    // เมื่อครบจำนวนสูงสุด (เช่น 10/10) ให้เปลี่ยนสถานะเป็น completed และจบเควส ไม่ให้เข้าร่วมต่อ
    if (updatedQuest.maxParticipants != null && updatedQuest.currentParticipants >= updatedQuest.maxParticipants) {
      await SocialQuest.findByIdAndUpdate(participation.quest._id, {
        $set: { status: 'completed', completedAt: new Date() }
      });
    }

    // For follow quests: Save owner's TikTok openId (user ID) to participant's approvedFollowers list
    // This prevents creating duplicate follow quests for the same user (one-time quest per TikTok user)
    // Check by openId instead of username because username can change but openId is permanent
    if (participation.quest?.template === 'tiktok_follow' && questOwnerId) {
      // Get owner's TikTok info (openId and username)
      const owner = await User.findById(questOwnerId)
        .select('integrations.tiktok.username integrations.tiktok.openId');

      if (owner?.integrations?.tiktok?.openId) {
        const ownerTiktokOpenId = owner.integrations.tiktok.openId;
        const ownerTiktokUsername = owner.integrations.tiktok.username?.toLowerCase() || '';

        // Get participant to add owner's openId to their approvedFollowers list
        const participant = await User.findById(participation.participant);
        if (participant) {
          // Check if this openId is already in participant's approvedFollowers (one-time check)
          const alreadyExists = participant.approvedFollowers?.some(
            f => f.tiktokOpenId === ownerTiktokOpenId
          );

          if (!alreadyExists) {
            // Add to participant's approvedFollowers list
            if (!participant.approvedFollowers) {
              participant.approvedFollowers = [];
            }
            participant.approvedFollowers.push({
              tiktokUsername: ownerTiktokUsername, // Optional: for display purposes
              tiktokOpenId: ownerTiktokOpenId, // Required: primary identifier
              approvedAt: new Date(),
              questId: participation.quest._id
            });
            await participant.save();
            console.log(`📝 Added TikTok user (openId: ${ownerTiktokOpenId}, username: @${ownerTiktokUsername}) to participant's approvedFollowers list - one-time quest enforced`);
          } else {
            console.log(`⚠️ TikTok user (openId: ${ownerTiktokOpenId}) already in approvedFollowers - quest already completed`);
          }
        }
      } else {
        console.warn(`⚠️ Owner ${questOwnerId} does not have TikTok openId - cannot add to approvedFollowers`);
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
        categories: ['points', 'quests', 'streak', 'social', 'system', 'job', 'reward', 'delivery', 'coupon']
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
      .select('name email photo userType points createdAt lastLogin verificationDocuments nationalId bankAccount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    // Convert verification document URLs to signed URLs
    const usersWithSignedUrls = await Promise.all(
      users.map(async (user) => {
        if (user.verificationDocuments) {
          const docs = user.verificationDocuments;
          const updatedDocs = { ...docs };

          // Convert ID card URL
          if (docs.idCard?.url) {
            try {
              updatedDocs.idCard = {
                ...docs.idCard,
                url: await getSignedUrl(docs.idCard.url),
              };
            } catch (e) {
              console.error(`Error getting signed URL for ID card (user ${user._id}):`, e);
              updatedDocs.idCard = docs.idCard;
            }
          }

          // Convert bank book URL
          if (docs.bankBook?.url) {
            try {
              updatedDocs.bankBook = {
                ...docs.bankBook,
                url: await getSignedUrl(docs.bankBook.url),
              };
            } catch (e) {
              console.error(`Error getting signed URL for bank book (user ${user._id}):`, e);
              updatedDocs.bankBook = docs.bankBook;
            }
          }

          // Convert face photo URL
          if (docs.facePhoto?.url) {
            try {
              updatedDocs.facePhoto = {
                ...docs.facePhoto,
                url: await getSignedUrl(docs.facePhoto.url),
              };
            } catch (e) {
              console.error(`Error getting signed URL for face photo (user ${user._id}):`, e);
              updatedDocs.facePhoto = docs.facePhoto;
            }
          }

          return {
            ...user,
            verificationDocuments: updatedDocs,
          };
        }
        return user;
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithSignedUrls,
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
      .populate('userId', 'name email photo isActive')
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
 * Normalize province name for matching (strip "จังหวัด", "ฯ", trim).
 * So "แพร่" matches "จังหวัดแพร่" and vice versa.
 */
function normalizeProvinceForMatch(name) {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/จังหวัด/g, '').replace(/ฯ/g, '').trim();
}

/**
 * GET /api/v2/admin/partners-by-province
 * Get approved partners in a province (for shop-request assign dropdown).
 * Matches province with/without "จังหวัด" prefix (e.g. แพร่ = จังหวัดแพร่).
 */
router.get('/partners-by-province', auth, adminAuth, async (req, res) => {
  try {
    const { province } = req.query;
    if (!province || typeof province !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter province is required'
      });
    }
    const raw = province.trim();
    const normalized = normalizeProvinceForMatch(raw);
    const withPrefix = normalized ? `จังหวัด${normalized}` : '';
    const provinceVariants = [raw, normalized, withPrefix].filter(Boolean);
    const unique = [...new Set(provinceVariants)];

    const partners = await Partner.find({
      status: 'approved',
      'workingArea.province': { $in: unique }
    })
      .populate('userId', 'name email phone')
      .sort({ partnerCode: 1 })
      .lean();

    return res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('❌ Error getting partners by province:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get partners'
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
 * Get cash reward redemptions. Supports status filter and pagination.
 * Query: status (optional), page (default 1), limit (default 20). Pagination metadata when limit provided.
 */
router.get('/cash-rewards', auth, adminAuth, async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const usePagination = limit != null;

    let query = {};
    if (status) {
      query.status = status;
    }

    if (usePagination) {
      const total = await CashReward.countDocuments(query);
      const skip = (pageNum - 1) * limitNum;
      const cashRewards = await CashReward.find(query)
        .populate('user', 'name email')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      res.json({
        success: true,
        data: cashRewards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    } else {
      const cashRewards = await CashReward.find(query)
        .populate('user', 'name email')
        .sort({ requestedAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: cashRewards
      });
    }
  } catch (error) {
    console.error('❌ Error getting cash rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/revenue-commission
 * เก็บรายได้ (platform fee revenue) + จ่าย commission (partner pending, cash rewards)
 */
router.get('/revenue-commission', auth, adminAuth, async (req, res) => {
  try {
    // เก็บรายได้: platformShare จาก ShopFeeSplitRecord (points)
    // รวม shop fees (delivery, dine_in) และ job fees (job_application_fee, job_commission_fee)
    const feeAgg = await ShopFeeSplitRecord.aggregate([
      { $group: { _id: '$feeType', total: { $sum: '$platformShare' }, count: { $sum: 1 } } }
    ]);
    const byFeeType = { delivery: 0, dine_in: 0, job_application_fee: 0, job_commission_fee: 0 };
    let totalPlatformRevenue = 0;
    for (const row of feeAgg) {
      if (byFeeType.hasOwnProperty(row._id)) {
        byFeeType[row._id] = row.total;
      }
      totalPlatformRevenue += row.total;
    }

    // จ่าย commission: Sum partnerShare จาก ShopFeeSplitRecord (points) - นี่คือ commission ที่ต้องจ่ายจริง
    const partnerCommissionAgg = await ShopFeeSplitRecord.aggregate([
      { $match: { partnerShare: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$partnerShare' } } }
    ]);
    const totalPartnerPendingPoints = Number(partnerCommissionAgg[0]?.total) || 0;

    // Cash rewards: pending / approved / paid (บาท)
    const cashAgg = await CashReward.aggregate([
      { $match: { status: { $in: ['pending', 'approved', 'paid'] } } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const cashPending = cashAgg.find((r) => r._id === 'pending') || { total: 0, count: 0 };
    const cashApproved = cashAgg.find((r) => r._id === 'approved') || { total: 0, count: 0 };
    const cashPaid = cashAgg.find((r) => r._id === 'paid') || { total: 0, count: 0 };

    res.json({
      success: true,
      data: {
        revenue: {
          totalPlatformPoints: totalPlatformRevenue,
          byFeeType: {
            delivery: byFeeType.delivery,
            dine_in: byFeeType.dine_in,
            job_application_fee: byFeeType.job_application_fee,
            job_commission_fee: byFeeType.job_commission_fee
          }
        },
        commission: {
          totalPartnerPendingPoints
        },
        cashRewards: {
          pending: { amount: cashPending.total, count: cashPending.count },
          approved: { amount: cashApproved.total, count: cashApproved.count },
          paid: { amount: cashPaid.total, count: cashPaid.count }
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting revenue-commission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/fee-commission-statistics
 * Get fee and commission statistics grouped by period (daily/monthly/yearly)
 */
router.get('/fee-commission-statistics', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // 'daily', 'monthly', 'yearly'

    // Determine date grouping format
    let dateFormat;
    let dateProjection;
    let startDate;

    const now = new Date();
    if (period === 'daily') {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%d/%m/%Y', date: '$createdAt' } };
    } else if (period === 'monthly') {
      // Last 12 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%m/%Y', date: '$createdAt' } };
    } else {
      // Last 5 years
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%Y', date: '$createdAt' } };
    }

    // Aggregate Fee (platformShare) by period
    const feeAgg = await ShopFeeSplitRecord.aggregate([
      {
        $match: {
          platformShare: { $gt: 0 },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: dateFormat,
          label: { $first: dateProjection },
          totalFee: { $sum: '$platformShare' },
          count: { $sum: 1 },
          deliveryFee: {
            $sum: {
              $cond: [{ $eq: ['$feeType', 'delivery'] }, '$platformShare', 0]
            }
          },
          dineInFee: {
            $sum: {
              $cond: [{ $eq: ['$feeType', 'dine_in'] }, '$platformShare', 0]
            }
          },
          jobApplicationFee: {
            $sum: {
              $cond: [{ $eq: ['$feeType', 'job_application_fee'] }, '$platformShare', 0]
            }
          },
          jobCommissionFee: {
            $sum: {
              $cond: [{ $eq: ['$feeType', 'job_commission_fee'] }, '$platformShare', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregate Commission (partnerShare) by period
    const commissionAgg = await ShopFeeSplitRecord.aggregate([
      {
        $match: {
          partnerShare: { $gt: 0 },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: dateFormat,
          label: { $first: dateProjection },
          totalCommission: { $sum: '$partnerShare' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Combine data by date
    const dataMap = new Map();

    // Add fee data
    feeAgg.forEach(item => {
      dataMap.set(item._id, {
        label: item.label,
        fee: item.totalFee,
        commission: 0,
        deliveryFee: item.deliveryFee,
        dineInFee: item.dineInFee,
        jobApplicationFee: item.jobApplicationFee,
        jobCommissionFee: item.jobCommissionFee,
        feeCount: item.count,
        commissionCount: 0
      });
    });

    // Add commission data
    commissionAgg.forEach(item => {
      if (dataMap.has(item._id)) {
        const existing = dataMap.get(item._id);
        existing.commission = item.totalCommission;
        existing.commissionCount = item.count;
      } else {
        dataMap.set(item._id, {
          label: item.label,
          fee: 0,
          commission: item.totalCommission,
          deliveryFee: 0,
          dineInFee: 0,
          jobApplicationFee: 0,
          jobCommissionFee: 0,
          feeCount: 0,
          commissionCount: item.count
        });
      }
    });

    // Convert to array and sort
    const data = Array.from(dataMap.values()).sort((a, b) => {
      // Sort by label (date string)
      return a.label.localeCompare(b.label);
    });

    // Calculate summary
    const summary = {
      totalFee: feeAgg.reduce((sum, item) => sum + item.totalFee, 0),
      totalCommission: commissionAgg.reduce((sum, item) => sum + item.totalCommission, 0),
      totalFeeCount: feeAgg.reduce((sum, item) => sum + item.count, 0),
      totalCommissionCount: commissionAgg.reduce((sum, item) => sum + item.count, 0),
      avgFee: data.length > 0 ? feeAgg.reduce((sum, item) => sum + item.totalFee, 0) / data.length : 0,
      avgCommission: data.length > 0 ? commissionAgg.reduce((sum, item) => sum + item.totalCommission, 0) / data.length : 0
    };

    res.json({
      success: true,
      data: {
        summary,
        data
      }
    });
  } catch (error) {
    console.error('❌ Error getting fee-commission-statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/platform-fee-history
 * Get platform fee history from ShopFeeSplitRecord
 */
router.get('/platform-fee-history', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get ShopFeeSplitRecord with platformShare > 0, sorted by createdAt desc
    const query = { platformShare: { $gt: 0 } };

    const total = await ShopFeeSplitRecord.countDocuments(query);
    const records = await ShopFeeSplitRecord.find(query)
      .populate('shop', 'name')
      .populate('order', 'orderNumber')
      .populate('job', 'title jobNumber')
      .populate('jobApplication', 'applicationNumber')
      .populate('partnerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format records for display
    const formattedRecords = records.map(record => {
      let source = '';
      let sourceName = '';

      if (record.feeType === 'delivery' || record.feeType === 'dine_in') {
        source = 'ร้าน';
        sourceName = record.shopName || record.shop?.name || 'N/A';
      } else if (record.feeType === 'job_application_fee') {
        source = 'งาน';
        sourceName = record.jobTitle || record.job?.title || 'N/A';
      } else if (record.feeType === 'job_commission_fee') {
        source = 'งาน';
        sourceName = record.jobTitle || record.job?.title || 'N/A';
      }

      const feeTypeText = {
        delivery: 'ค่าจัดส่ง',
        dine_in: 'ค่ากินที่ร้าน',
        job_application_fee: 'ค่าธรรมเนียมสมัครงาน',
        job_commission_fee: 'ค่านายหน้าจ้างงาน'
      }[record.feeType] || record.feeType;

      return {
        _id: record._id,
        feeType: record.feeType,
        feeTypeText,
        platformShare: record.platformShare,
        source,
        sourceName,
        orderNumber: record.orderNumber || record.order?.orderNumber,
        jobNumber: record.jobNumber || record.job?.jobNumber,
        createdAt: record.createdAt
      };
    });

    res.json({
      success: true,
      data: formattedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting platform fee history:', error);
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
    const { useOmisePayout = true } = req.body; // Default: true to use Omise Payout API (can set false to disable)

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

    // Deduct points from user when approving withdrawal
    const user = await User.findById(cashReward.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    // Check if user still has enough points (in case they spent some while pending)
    if ((user.points || 0) < cashReward.pointsUsed) {
      return res.status(400).json({
        success: false,
        message: `ผู้ใช้มีคะแนนไม่พอ (ต้องการ: ${cashReward.pointsUsed.toLocaleString()}, มี: ${(user.points || 0).toLocaleString()})`
      });
    }

    // Optionally use Omise Payout API for automatic transfer
    let omiseTransfer = null;
    let transferCompleted = false;
    if (useOmisePayout && process.env.OMISE_SECRET_KEY) {
      try {
        const paymentService = require('../services/paymentService');

        // Check Omise balance first (use transferable balance, not available)
        const balance = await paymentService.getBalance();
        const transferableBalance = (balance.transferable || 0) / 100; // Convert from satang to THB
        const availableBalance = (balance.available || 0) / 100; // Also check available for reference

        console.log(`💰 Omise balance check: transferable=${transferableBalance} THB, available=${availableBalance} THB, required=${cashReward.amount} THB`);

        if (transferableBalance < cashReward.amount) {
          console.warn(`⚠️ Omise transferable balance insufficient: ${transferableBalance} THB < ${cashReward.amount} THB`);
          console.warn(`   Total balance: ${(balance.total || 0) / 100} THB, On Hold: ${(balance.on_hold || 0) / 100} THB`);
          console.warn(`   Funds are on hold and not yet transferable. Transfer will be pending until funds become transferable.`);

          // Store balance info in metadata
          if (!cashReward.metadata) {
            cashReward.metadata = {};
          }
          cashReward.metadata.omiseBalance = {
            transferable: transferableBalance,
            available: availableBalance,
            total: (balance.total || 0) / 100,
            onHold: (balance.on_hold || 0) / 100
          };
          cashReward.metadata.insufficientTransferableBalance = true;

          // Notify admins that transferable balance is insufficient
          try {
            const { createManualTransferRequiredNotification } = require('../utils/notificationHelper');
            await createManualTransferRequiredNotification(
              user._id.toString(),
              user.name,
              user.email,
              cashReward.amount,
              cashReward.pointsUsed,
              cashReward._id.toString(),
              [`Omise transferable balance insufficient (${transferableBalance} THB < ${cashReward.amount} THB). Funds are on hold.`]
            );
            console.log(`📧 Sent insufficient balance notification to admins`);
          } catch (notifError) {
            console.error('⚠️ Failed to send insufficient balance notification:', notifError);
          }

          // Continue with approval but note that transfer will be pending
        } else {
          // Use existing recipient from user's bankAccount (created during verification approval)
          // Only create new recipient if it doesn't exist
          let recipient = null;
          let recipientStatus = null;

          if (user.bankAccount?.omiseRecipientId) {
            // User already has recipient from verification approval
            try {
              recipient = await paymentService.getRecipientInfo(user.bankAccount.omiseRecipientId);
              recipientStatus = await paymentService.checkRecipientStatus(recipient.id);
              console.log(`✅ Using existing Omise recipient from verification: ${recipient.id} (verified: ${recipient.verified}, active: ${recipient.active})`);
            } catch (error) {
              console.warn(`⚠️ Could not retrieve stored recipient ${user.bankAccount.omiseRecipientId}:`, error.message);
              console.log(`   Recipient should have been created during verification approval`);
              user.bankAccount.omiseRecipientId = null; // Clear invalid ID
              recipient = null; // Mark as not found
            }
          }

          // If no valid recipient found, skip Omise payout and require manual transfer
          if (!recipient) {
            console.warn(`⚠️ No Omise recipient found for user ${user._id}. Recipient should have been created during verification approval.`);
            console.log(`   Skipping Omise transfer - manual transfer required`);

            // Store metadata
            if (!cashReward.metadata) {
              cashReward.metadata = {};
            }
            cashReward.metadata.payoutSkipped = true;
            cashReward.metadata.payoutSkippedReason = 'No Omise recipient found - recipient should be created during verification approval';
            cashReward.metadata.requiresManualTransfer = true;

            // Notify admins that manual transfer is needed
            try {
              const { createManualTransferRequiredNotification } = require('../utils/notificationHelper');
              await createManualTransferRequiredNotification(
                user._id.toString(),
                user.name,
                user.email,
                cashReward.amount,
                cashReward.pointsUsed,
                cashReward._id.toString(),
                ['No Omise recipient found. Recipient should be created during verification approval.']
              );
              console.log(`📧 Sent manual transfer required notification to admins`);
            } catch (notifError) {
              console.error('⚠️ Failed to send manual transfer notification:', notifError);
            }
          } else {
            // Store recipient info in metadata
            if (!cashReward.metadata) {
              cashReward.metadata = {};
            }
            cashReward.metadata.omiseRecipientId = recipient.id;
            cashReward.metadata.recipientStatus = recipientStatus;

            if (!recipientStatus.canReceiveTransfers) {
              console.warn(`⚠️ Recipient ${recipient.id} cannot receive transfers:`, recipientStatus.issues);
              cashReward.metadata.recipientIssues = recipientStatus.issues;
              cashReward.metadata.payoutSkipped = true;
              cashReward.metadata.payoutSkippedReason = 'Recipient not verified/active';
              cashReward.metadata.requiresManualTransfer = true;
              console.log(`⏳ Skipping Omise transfer creation - recipient not ready. Status: verified=${recipientStatus.verified}, active=${recipientStatus.active}`);
              console.log(`   Admin can process manually later or wait for recipient verification (usually 24-48 hours)`);

              // Notify admins that manual transfer is needed
              try {
                const { createManualTransferRequiredNotification } = require('../utils/notificationHelper');
                await createManualTransferRequiredNotification(
                  user._id.toString(),
                  user.name,
                  user.email,
                  cashReward.amount,
                  cashReward.pointsUsed,
                  cashReward._id.toString(),
                  recipientStatus.issues
                );
                console.log(`📧 Sent manual transfer required notification to admins`);
              } catch (notifError) {
                console.error('⚠️ Failed to send manual transfer notification:', notifError);
              }
            } else {
              // Recipient is ready - create payout transfer
              try {
                omiseTransfer = await paymentService.createPayout(
                  cashReward.amount,
                  recipient.id
                );

                // Check transfer status - Omise transfers may use 'paid' or 'sent' boolean fields
                // Also check if status field exists
                const isPaid = omiseTransfer.paid === true || omiseTransfer.status === 'paid';
                const isSent = omiseTransfer.sent === true || omiseTransfer.status === 'sent';

                if (isPaid || isSent) {
                  transferCompleted = true;
                  console.log(`✅ Omise transfer ${omiseTransfer.id} already completed (paid: ${omiseTransfer.paid}, sent: ${omiseTransfer.sent}, status: ${omiseTransfer.status || 'N/A'})`);
                } else {
                  const statusInfo = omiseTransfer.status || (omiseTransfer.paid ? 'paid' : omiseTransfer.sent ? 'sent' : 'pending');
                  console.log(`⏳ Omise transfer ${omiseTransfer.id} status: ${statusInfo} - will deduct points when transfer completes`);
                }

                // Store Omise transfer ID in cashReward metadata
                cashReward.metadata.omiseTransferId = omiseTransfer.id;
                cashReward.metadata.payoutMethod = 'omise';
                cashReward.metadata.transferStatus = omiseTransfer.status;

                console.log(`💰 Omise payout created: Transfer ${omiseTransfer.id} for ${cashReward.amount} THB (status: ${omiseTransfer.status})`);
              } catch (payoutError) {
                // If payout fails, log but don't fail approval
                console.error(`❌ Failed to create Omise payout for recipient ${recipient.id}:`, payoutError.message);
                cashReward.metadata.omiseError = payoutError.message;
                cashReward.metadata.payoutFailed = true;
                cashReward.metadata.requiresManualTransfer = true;

                // Notify all admins that manual transfer is needed
                try {
                  const { createManualTransferRequiredNotification } = require('../utils/notificationHelper');
                  await createManualTransferRequiredNotification(
                    user._id.toString(),
                    user.name,
                    user.email,
                    cashReward.amount,
                    cashReward.pointsUsed,
                    cashReward._id.toString(),
                    [payoutError.message]
                  );
                  console.log(`📧 Sent manual transfer required notification to admins`);
                } catch (notifError) {
                  console.error('⚠️ Failed to send manual transfer required notification:', notifError);
                  // Don't fail the approval if notification fails
                }
                // Continue with approval - admin can process manually later
              }
            }
          }
        }
      } catch (omiseError) {
        console.error('❌ Omise payout error:', omiseError);
        // Don't fail the approval, just log the error
        // Admin can still mark as paid manually later
        if (!cashReward.metadata) {
          cashReward.metadata = {};
        }
        cashReward.metadata.omiseError = omiseError.message;
      }
    }

    // Deduct points ONLY if:
    // 1. Not using Omise (manual processing), OR
    // 2. Using Omise but transfer is already completed (paid/sent)
    if (!useOmisePayout || !omiseTransfer || transferCompleted) {
      // Deduct points
      user.points = (user.points || 0) - cashReward.pointsUsed;
      await user.save();

      // Update PointTransaction to reflect actual deduction
      const pointTransaction = await PointTransaction.findOne({
        relatedModel: 'CashReward',
        relatedId: cashReward._id,
        status: 'pending'
      });

      if (pointTransaction) {
        pointTransaction.amount = -cashReward.pointsUsed;
        pointTransaction.status = 'completed';
        pointTransaction.description = transferCompleted
          ? `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - โอนเงินผ่าน Omise แล้ว`
          : `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - อนุมัติแล้ว`;
        // Ensure metadata exists before updating
        if (!pointTransaction.metadata) {
          pointTransaction.metadata = {};
        }
        pointTransaction.metadata.pendingApproval = false;
        if (omiseTransfer) {
          pointTransaction.metadata.omiseTransferId = omiseTransfer.id;
        }
        await pointTransaction.save();
      }
    } else {
      // Using Omise but transfer is pending - don't deduct points yet
      // Points will be deducted when transfer webhook confirms payment
      console.log(`⏳ Points NOT deducted yet - waiting for Omise transfer ${omiseTransfer.id} to complete`);

      // Update PointTransaction to show pending transfer
      const pointTransaction = await PointTransaction.findOne({
        relatedModel: 'CashReward',
        relatedId: cashReward._id,
        status: 'pending'
      });

      if (pointTransaction) {
        pointTransaction.description = `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - รอการโอนเงินผ่าน Omise`;
        if (!pointTransaction.metadata) {
          pointTransaction.metadata = {};
        }
        pointTransaction.metadata.omiseTransferId = omiseTransfer.id;
        pointTransaction.metadata.waitingForTransfer = true;
        await pointTransaction.save();
      }
    }

    cashReward.status = 'approved';
    await cashReward.save();

    // Send notification to user about approval
    try {
      const { createWithdrawalApprovalNotification } = require('../utils/notificationHelper');
      await createWithdrawalApprovalNotification(
        user._id.toString(),
        cashReward.amount,
        cashReward.pointsUsed,
        cashReward._id.toString(),
        omiseTransfer ? omiseTransfer.id : null
      );
      console.log(`✅ Sent withdrawal approval notification to user ${user._id}`);
    } catch (notifError) {
      console.error('⚠️ Failed to send withdrawal approval notification to user:', notifError);
      // Don't fail the approval if notification fails
    }

    console.log(`✅ Admin ${req.user.id} approved cash reward ${id} - deducted ${cashReward.pointsUsed} points from user ${user._id}${omiseTransfer ? ` - Omise transfer: ${omiseTransfer.id}` : ''}`);

    res.json({
      success: true,
      message: omiseTransfer ? 'อนุมัติการถอนเงินแล้ว (โอนเงินผ่าน Omise แล้ว)' : 'อนุมัติการถอนเงินแล้ว (รอการโอนเงินด้วยตนเอง)',
      data: {
        ...cashReward.toObject(),
        omiseTransfer: omiseTransfer ? {
          id: omiseTransfer.id,
          status: omiseTransfer.status,
          amount: omiseTransfer.amount / 100
        } : null
      }
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
 * GET /api/v2/admin/cash-rewards/:id/recipient-status
 * Check Omise recipient status (verified, active, issues)
 */
router.get('/cash-rewards/:id/recipient-status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cashReward = await CashReward.findById(id);
    if (!cashReward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอถอนเงิน'
      });
    }

    if (!cashReward.metadata?.omiseRecipientId) {
      return res.status(400).json({
        success: false,
        message: 'ยังไม่มี Omise recipient สำหรับคำขอนี้'
      });
    }

    const paymentService = require('../services/paymentService');
    const status = await paymentService.checkRecipientStatus(cashReward.metadata.omiseRecipientId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Error checking recipient status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/transfers/:id/mark-as-sent
 * Mark a transfer as sent (test mode only)
 * This allows immediate transfer in test mode, bypassing transferable balance check
 */
router.post('/transfers/:id/mark-as-sent', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow in test mode
    if (process.env.OMISE_SECRET_KEY && !process.env.OMISE_SECRET_KEY.includes('_test_')) {
      return res.status(403).json({
        success: false,
        message: 'mark_as_sent is only available in test mode'
      });
    }

    const paymentService = require('../services/paymentService');
    const transfer = await paymentService.markTransferAsSent(id);

    // Find cash reward by transfer ID and process if needed
    const cashReward = await CashReward.findOne({
      'metadata.omiseTransferId': id
    });

    if (cashReward) {
      // Update transfer status in metadata
      if (!cashReward.metadata) {
        cashReward.metadata = {};
      }
      cashReward.metadata.transferStatus = 'sent';
      cashReward.metadata.markedAsSentManually = true;
      cashReward.metadata.markedAsSentBy = req.user.id;
      cashReward.metadata.markedAsSentAt = new Date();
      await cashReward.save();

      // If transfer is sent, deduct points and mark as paid
      if (transfer.sent) {
        const user = await User.findById(cashReward.user);
        if (user) {
          // Check if points already deducted
          const pointTransaction = await PointTransaction.findOne({
            relatedModel: 'CashReward',
            relatedId: cashReward._id
          });

          if (pointTransaction && pointTransaction.status === 'pending' && pointTransaction.metadata?.waitingForTransfer) {
            // Deduct points
            const oldPoints = user.points || 0;
            user.points = oldPoints - cashReward.pointsUsed;
            await user.save();

            // Update PointTransaction
            pointTransaction.amount = -cashReward.pointsUsed;
            pointTransaction.status = 'completed';
            pointTransaction.description = `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - โอนเงินผ่าน Omise แล้ว (marked as sent)`;
            pointTransaction.metadata.waitingForTransfer = false;
            await pointTransaction.save();

            console.log(`✅ Marked as sent: Deducted ${cashReward.pointsUsed} points from user ${user._id}`);
          }

          // Mark cash reward as paid
          if (cashReward.status === 'approved') {
            cashReward.status = 'paid';
            cashReward.paidAt = new Date();
            await cashReward.save();

            // Send notification to user
            try {
              const { createWithdrawalPaidNotification } = require('../utils/notificationHelper');
              await createWithdrawalPaidNotification(
                user._id.toString(),
                cashReward.amount,
                cashReward.pointsUsed,
                cashReward._id.toString(),
                'omise'
              );
            } catch (notifError) {
              console.error('⚠️ Failed to send withdrawal paid notification:', notifError);
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Transfer marked as sent (test mode)',
      data: {
        id: transfer.id,
        sent: transfer.sent,
        paid: transfer.paid,
        sendable: transfer.sendable
      }
    });
  } catch (error) {
    console.error('❌ Error marking transfer as sent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/recipients/:id/verify
 * Manually verify a recipient (test mode only)
 */
router.post('/recipients/:id/verify', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow in test mode
    if (process.env.OMISE_SECRET_KEY && !process.env.OMISE_SECRET_KEY.includes('_test_')) {
      return res.status(403).json({
        success: false,
        message: 'Manual verification is only available in test mode'
      });
    }

    const paymentService = require('../services/paymentService');
    const recipient = await paymentService.verifyRecipient(id);

    res.json({
      success: true,
      message: 'Recipient verified successfully',
      data: {
        id: recipient.id,
        verified: recipient.verified,
        active: recipient.active
      }
    });
  } catch (error) {
    console.error('❌ Error verifying recipient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/cash-rewards/:id/recipient-info
 * Get Omise recipient bank account information
 */
router.get('/cash-rewards/:id/recipient-info', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const cashReward = await CashReward.findById(id);
    if (!cashReward) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอถอนเงิน'
      });
    }

    // Check if Omise recipient ID exists
    const recipientId = cashReward.metadata?.omiseRecipientId;
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ Omise recipient ID สำหรับคำขอนี้'
      });
    }

    try {
      const paymentService = require('../services/paymentService');
      const bankAccountInfo = await paymentService.getRecipientBankAccount(recipientId);

      return res.json({
        success: true,
        data: bankAccountInfo
      });
    } catch (omiseError) {
      console.error('❌ Error getting recipient info:', omiseError);
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงข้อมูล recipient จาก Omise ได้',
        error: omiseError.message
      });
    }
  } catch (error) {
    console.error('❌ Error getting recipient info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/admin/cash-rewards/:id/pay
 * Mark cash reward as paid (manual transfer)
 * This will:
 * 1. Deduct points if not already deducted
 * 2. Update PointTransaction status
 * 3. Mark cash reward as paid
 * 4. Send notification to user
 */
router.post('/cash-rewards/:id/pay', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const cashReward = await CashReward.findById(id).populate('user');
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

    const user = cashReward.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check if points were already deducted
    const pointTransaction = await PointTransaction.findOne({
      relatedModel: 'CashReward',
      relatedId: cashReward._id
    });

    let pointsDeducted = false;
    if (pointTransaction && pointTransaction.status === 'completed' && pointTransaction.amount < 0) {
      // Points already deducted
      pointsDeducted = true;
      console.log(`ℹ️ Points already deducted for cash reward ${id}`);
    } else {
      // Deduct points now (manual transfer)
      const oldPoints = user.points || 0;
      user.points = oldPoints - cashReward.pointsUsed;
      await user.save();
      pointsDeducted = true;
      console.log(`✅ Deducted ${cashReward.pointsUsed} points from user ${user._id} (${oldPoints} → ${user.points})`);

      // Update or create PointTransaction
      if (pointTransaction) {
        pointTransaction.amount = -cashReward.pointsUsed;
        pointTransaction.status = 'completed';
        pointTransaction.description = `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - โอนเงินด้วยตนเองแล้ว`;
        if (!pointTransaction.metadata) {
          pointTransaction.metadata = {};
        }
        pointTransaction.metadata.manualTransfer = true;
        pointTransaction.metadata.transferredBy = req.user.id;
        pointTransaction.metadata.transferredAt = new Date();
        await pointTransaction.save();
      } else {
        // Create new PointTransaction if doesn't exist
        await PointTransaction.create({
          userId: user._id,
          type: 'withdrawal',
          amount: -cashReward.pointsUsed,
          status: 'completed',
          description: `ถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - โอนเงินด้วยตนเองแล้ว`,
          relatedModel: 'CashReward',
          relatedId: cashReward._id,
          metadata: {
            manualTransfer: true,
            transferredBy: req.user.id,
            transferredAt: new Date()
          }
        });
      }
    }

    // Mark cash reward as paid
    cashReward.status = 'paid';
    cashReward.paidAt = new Date();
    cashReward.paidBy = req.user.id;
    if (adminNotes) {
      cashReward.adminNotes = adminNotes;
    }

    // Update metadata to indicate manual transfer
    if (!cashReward.metadata) {
      cashReward.metadata = {};
    }
    cashReward.metadata.manualTransfer = true;
    cashReward.metadata.manualTransferBy = req.user.id;
    cashReward.metadata.manualTransferAt = new Date();

    await cashReward.save();

    // Send notification to user about payment
    try {
      const { createWithdrawalPaidNotification } = require('../utils/notificationHelper');
      const paymentMethod = 'manual'; // Always manual when using this endpoint
      await createWithdrawalPaidNotification(
        user._id.toString(),
        cashReward.amount,
        cashReward.pointsUsed,
        cashReward._id.toString(),
        paymentMethod
      );
      console.log(`✅ Sent withdrawal paid notification to user ${user._id}`);
    } catch (notifError) {
      console.error('⚠️ Failed to send withdrawal paid notification to user:', notifError);
      // Don't fail the payment confirmation if notification fails
    }

    console.log(`💰 Admin ${req.user.id} marked cash reward ${id} as paid (manual transfer)${pointsDeducted ? ' - points deducted' : ''}`);

    res.json({
      success: true,
      message: 'ยืนยันการจ่ายเงินแล้ว (โอนเงินด้วยตนเอง)',
      data: {
        ...cashReward.toObject(),
        pointsDeducted
      }
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

    // NOTE: Points are NOT deducted until approval, so no refund needed
    // However, we'll update the PointTransaction to mark it as rejected
    const pointTransaction = await PointTransaction.findOne({
      relatedModel: 'CashReward',
      relatedId: cashReward._id,
      status: 'pending'
    });

    if (pointTransaction) {
      pointTransaction.status = 'failed'; // Use 'failed' instead of 'rejected' (not in enum: completed, pending, failed, refunded)
      pointTransaction.description = `คำขอถอน Point ${cashReward.pointsUsed.toLocaleString()} (${cashReward.amount.toLocaleString()} บาท) - ถูกปฏิเสธ${reason ? ': ' + reason : ''}`;
      await pointTransaction.save();
    }

    // No need to refund points since they were never deducted
    // (Points are only deducted when approved, not when requested)

    cashReward.status = 'rejected';
    if (reason) {
      cashReward.adminNotes = reason;
    }
    await cashReward.save();

    // Send notification to user about rejection
    try {
      const user = await User.findById(cashReward.user);
      if (user) {
        const { createWithdrawalRejectionNotification } = require('../utils/notificationHelper');
        await createWithdrawalRejectionNotification(
          user._id.toString(),
          cashReward.amount,
          cashReward.pointsUsed,
          cashReward._id.toString(),
          reason
        );
        console.log(`✅ Sent withdrawal rejection notification to user ${user._id}`);
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send withdrawal rejection notification to user:', notifError);
      // Don't fail the rejection if notification fails
    }

    console.log(`❌ Admin ${req.user.id} rejected cash reward ${id}`);

    res.json({
      success: true,
      message: 'ปฏิเสธการถอนเงินแล้ว',
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

/**
 * GET /api/v2/admin/riders
 * Get all riders with filtering (admin only)
 */
router.get('/riders', auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { idCardNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { riderCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const riders = await Rider.find(query)
      .populate('user', 'name email phone')
      .populate('adminApproval.reviewedBy', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Rider.countDocuments(query);

    // Get statistics
    const stats = {
      pending: await Rider.countDocuments({ status: 'pending' }),
      active: await Rider.countDocuments({ status: 'active' }),
      suspended: await Rider.countDocuments({ status: 'suspended' }),
      rejected: await Rider.countDocuments({ status: 'rejected' })
    };

    res.json({
      success: true,
      data: riders,
      count: riders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats
    });
  } catch (error) {
    console.error('❌ Error getting riders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
});

/**
 * GET /api/v2/admin/rider-income
 * Aggregate rider income (sum of riderFee from delivered deliveries). Optional period for time series.
 */
router.get('/rider-income', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // 'daily', 'monthly', 'yearly' or omit for summary only

    const now = new Date();
    let startDate;
    let dateFormat;
    let dateProjection;

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%d/%m/%Y', date: '$createdAt' } };
    } else if (period === 'monthly') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%m/%Y', date: '$createdAt' } };
    } else if (period === 'yearly') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
      dateProjection = { $dateToString: { format: '%Y', date: '$createdAt' } };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be: daily, monthly, or yearly'
      });
    }

    const agg = await Delivery.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: dateFormat,
          label: { $first: dateProjection },
          totalEarnings: { $sum: { $ifNull: ['$riderFee', 0] } },
          deliveryCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalEarnings = agg.reduce((sum, item) => sum + item.totalEarnings, 0);
    const totalDeliveries = agg.reduce((sum, item) => sum + item.deliveryCount, 0);

    res.json({
      success: true,
      data: {
        period,
        series: agg.map((item) => ({
          label: item.label,
          totalEarnings: item.totalEarnings,
          deliveryCount: item.deliveryCount
        })),
        summary: {
          totalEarnings,
          totalDeliveries,
          avgPerDelivery: totalDeliveries > 0 ? Math.round((totalEarnings / totalDeliveries) * 100) / 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting rider income:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/riders/:riderId/statistics
 * Get rider statistics (admin view dashboard for specific rider)
 */
router.get('/riders/:riderId/statistics', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const { period = 'daily' } = req.query;

    const rider = await Rider.findById(riderId).lean();
    if (!rider) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Rider' });
    }

    const userIdForQuery = rider.user?.toString?.() || String(rider.user);
    const riderCodeForQuery = rider.riderCode || null;

    const now = new Date();
    let startDate, groupFormat;

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    } else if (period === 'monthly') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    } else if (period === 'yearly') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      groupFormat = { year: { $year: '$createdAt' } };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid period. Must be: daily, monthly, or yearly' });
    }

    const matchQuery = { createdAt: { $gte: startDate, $lte: now } };
    if (riderCodeForQuery) {
      matchQuery.$or = [
        { riderCode: riderCodeForQuery },
        { rider: new mongoose.Types.ObjectId(userIdForQuery) }
      ];
    } else {
      matchQuery.rider = new mongoose.Types.ObjectId(userIdForQuery);
    }

    const deliveryData = await Delivery.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupFormat,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelledDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, { $ifNull: ['$riderFee', 0] }, 0]
            }
          },
          avgEarnings: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                { $ifNull: ['$riderFee', 0] },
                null
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const formattedData = deliveryData.map((item) => {
      let label;
      if (period === 'daily') {
        const d = new Date(item._id.year, item._id.month - 1, item._id.day);
        label = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
      } else if (period === 'monthly') {
        const d = new Date(item._id.year, item._id.month - 1);
        label = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      } else {
        label = `${item._id.year}`;
      }
      return {
        label,
        totalDeliveries: item.totalDeliveries,
        completedDeliveries: item.completedDeliveries || 0,
        cancelledDeliveries: item.cancelledDeliveries || 0,
        earnings: item.totalEarnings || 0,
        avgEarnings: Math.round((item.avgEarnings || 0) * 100) / 100
      };
    });

    const totalDeliveries = formattedData.reduce((s, i) => s + i.totalDeliveries, 0);
    const totalCompleted = formattedData.reduce((s, i) => s + i.completedDeliveries, 0);
    const totalCancelled = formattedData.reduce((s, i) => s + i.cancelledDeliveries, 0);
    const totalEarnings = formattedData.reduce((s, i) => s + i.earnings, 0);
    const avgEarnings = formattedData.length > 0 ? totalEarnings / formattedData.length : 0;
    const avgPerDelivery = totalCompleted > 0 ? Math.round((totalEarnings / totalCompleted) * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        period,
        data: formattedData,
        summary: {
          totalDeliveries,
          totalCompleted,
          totalCancelled,
          totalEarnings,
          avgEarnings: Math.round(avgEarnings * 100) / 100,
          avgPerDelivery
        }
      }
    });
  } catch (error) {
    console.error('❌ GET /admin/riders/:riderId/statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/admin/riders/:riderId
 * Get rider details with images (admin only)
 */
router.get('/riders/:riderId', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const { getSignedUrl } = require('../utils/gcpStorage');

    const rider = await Rider.findById(riderId)
      .populate('user', 'name email phone')
      .populate('adminApproval.reviewedBy', 'name email')
      .lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    // Generate signed URLs for images
    let idCardImageUrl = rider.idCardImage;
    let driverLicenseImageUrl = rider.driverLicenseImage;

    if (rider.idCardImage) {
      try {
        idCardImageUrl = await getSignedUrl(rider.idCardImage);
      } catch (error) {
        console.error('Error generating signed URL for idCard:', error);
      }
    }

    if (rider.driverLicenseImage) {
      try {
        driverLicenseImageUrl = await getSignedUrl(rider.driverLicenseImage);
      } catch (error) {
        console.error('Error generating signed URL for driverLicense:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...rider,
        idCardImage: idCardImageUrl,
        driverLicenseImage: driverLicenseImageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error getting rider details:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/settings/point-conversion-rate
 * Get point conversion rate (1 point = X THB)
 * Public endpoint - users need to know the rate
 */
router.get('/settings/point-conversion-rate', async (req, res) => {
  try {
    let rate = await QuestSettings.getSetting('point_conversion_rate');

    // If setting doesn't exist, create it with default value 1
    if (rate === null) {
      await QuestSettings.updateSetting('point_conversion_rate', 1, null);
      rate = 1;
    }

    return res.json({
      success: true,
      data: {
        rate: rate
      }
    });
  } catch (error) {
    console.error('Error fetching point conversion rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversion rate',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/settings/point-conversion-rate
 * Update point conversion rate (admin only)
 */
router.put('/settings/point-conversion-rate', auth, adminAuth, async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a positive number'
      });
    }

    await QuestSettings.updateSetting('point_conversion_rate', rate, req.user._id);

    return res.json({
      success: true,
      data: {
        rate: rate
      },
      message: 'Point conversion rate updated successfully'
    });
  } catch (error) {
    console.error('Error updating point conversion rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update conversion rate',
      error: error.message
    });
  }
});

/**
 * PUT /api/v2/admin/users/:userId/bank-account/verify
 * Verify user's bank account (admin only)
 */
router.put('/users/:userId/bank-account/verify', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.bankAccount || !user.bankAccount.accountName) {
      return res.status(400).json({
        success: false,
        message: 'User does not have bank account information'
      });
    }

    user.bankAccount.verified = verified === true;
    if (verified === true) {
      user.bankAccount.verifiedAt = new Date();
      user.bankAccount.verifiedBy = req.user._id;
    } else {
      user.bankAccount.verifiedAt = null;
      user.bankAccount.verifiedBy = null;
    }
    await user.save();

    return res.json({
      success: true,
      data: {
        userId: user._id,
        bankAccount: {
          accountName: user.bankAccount.accountName,
          accountNumber: user.bankAccount.accountNumber,
          bankName: user.bankAccount.bankName,
          verified: user.bankAccount.verified,
          verifiedAt: user.bankAccount.verifiedAt
        }
      },
      message: `Bank account ${verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Error verifying bank account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify bank account',
      error: error.message
    });
  }
});

module.exports = router;
