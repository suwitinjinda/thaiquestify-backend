const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
// Collection: 'socialquests' - เควสจากชุมชน (TikTok follow, share URL)
const SocialQuest = require('../models/SocialQuest');
const SocialQuestParticipation = require('../models/SocialQuestParticipation');
const DailyQuestService = require('../new-services/daily-quests/dailyQuestService');
const StreakService = require('../new-services/streak/streakService');

/**
 * GET /api/v2/dashboard
 * Get comprehensive dashboard data for the authenticated user
 */
router.get('/v2/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 Loading dashboard data for user:', userId);

    // Fetch user with all related data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get streak stats (this may update user document, but now handles version conflicts gracefully)
    let streakStats;
    try {
      streakStats = await StreakService.getStreakStats(userId);
    } catch (streakError) {
      console.error('⚠️ Error getting streak stats, using defaults:', streakError.message);
      // Use default values if streak service fails
      streakStats = {
        currentStreak: user.streakStats?.currentStreak || 0,
        longestStreak: user.streakStats?.longestStreak || 0,
        dailyCompleted: user.streakStats?.dailyQuestsCompletedToday || 0,
        totalPoints: user.streakStats?.totalPointsEarned || 0,
        nextReset: '24h 0m',
        multiplier: 1.0
      };
    }

    // Get today's daily quests
    const dailyQuests = await DailyQuestService.getTodaysQuests(userId);
    const dailyQuestsCompleted = dailyQuests.filter(q => q.isCompleted).length;
    const dailyQuestsTotal = dailyQuests.length;

    // Get social quest stats
    const socialQuestsCreated = await SocialQuest.countDocuments({ owner: userId });
    const socialQuestsActive = await SocialQuest.countDocuments({
      owner: userId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    // Get user's created quests with stats
    const myQuests = await SocialQuest.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Get participation stats for each quest
    const questIds = myQuests.map(q => q._id);
    const participations = await SocialQuestParticipation.find({
      quest: { $in: questIds }
    }).lean();

    const statsMap = {};
    participations.forEach(p => {
      const questId = p.quest.toString();
      if (!statsMap[questId]) {
        statsMap[questId] = {
          total: 0,
          pending: 0,
          approved: 0,
          denied: 0
        };
      }
      statsMap[questId].total++;
      statsMap[questId][p.status === 'approved' ? 'approved' : p.status === 'denied' ? 'denied' : 'pending']++;
    });

    const myQuestsWithStats = myQuests.map(quest => ({
      id: quest._id,
      title: quest.title,
      template: quest.template,
      status: quest.status,
      pointsReward: quest.pointsReward,
      pointsCost: quest.pointsCost,
      currentParticipants: quest.currentParticipants || 0,
      maxParticipants: quest.maxParticipants,
      createdAt: quest.createdAt,
      expiresAt: quest.expiresAt,
      stats: statsMap[quest._id.toString()] || {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0
      }
    }));

    // Get social quest participation stats - separate pending, approved, and rejected
    const socialQuestsParticipatedPending = await SocialQuestParticipation.countDocuments({
      participant: userId,
      status: 'pending'
    });
    
    const socialQuestsParticipatedApproved = await SocialQuestParticipation.countDocuments({
      participant: userId,
      status: 'approved'
    });

    const socialQuestsParticipatedRejected = await SocialQuestParticipation.countDocuments({
      participant: userId,
      status: 'denied'
    });

    // Get pending participations for user to see their pending participations
    const pendingParticipations = await SocialQuestParticipation.find({
      participant: userId,
      status: 'pending'
    })
      .populate('quest', 'title template tiktokProfile')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent quest history (last 5)
    const recentQuests = user.questHistory
      ? user.questHistory
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 5)
          .map(quest => ({
            questId: quest.questId,
            questType: quest.questType || 'normal',
            completedAt: quest.completedAt,
            pointsEarned: quest.pointsEarned || 0,
            streakMultiplier: quest.streakMultiplier || 1.0,
            status: quest.status || 'completed'
          }))
      : [];

    // Format recent activities for display
    const recentActivities = recentQuests.map((quest, index) => {
      const questTypeLabels = {
        daily: 'เควสรายวัน',
        social: 'เควสชุมชน',
        normal: 'เควสปกติ',
        special: 'เควสพิเศษ'
      };

      const timeAgo = getTimeAgo(quest.completedAt);

      return {
        id: quest.questId?.toString() || `quest-${index}`,
        title: `${questTypeLabels[quest.questType] || 'เควส'} สำเร็จ`,
        points: quest.pointsEarned || 0,
        time: timeAgo,
        type: quest.questType,
        completedAt: quest.completedAt
      };
    });

    // Calculate completion rate
    const completionRate = user.streakStats?.totalQuestsCompleted > 0
      ? Math.round((dailyQuestsCompleted / dailyQuestsTotal) * 100) || 0
      : 0;

    // Prepare dashboard data
    const dashboardData = {
      // User Info
      user: {
        name: user.name,
        email: user.email,
        photo: user.photo,
        userType: user.userType,
        partnerCode: user.partnerCode || null,
        partnerId: user.partnerId || null
      },

      // Points & Stats
      points: user.points || 0,
      totalQuestsCompleted: user.streakStats?.totalQuestsCompleted || 0,
      totalPointsEarned: user.streakStats?.totalPointsEarned || 0,

      // Streak Info
      streak: {
        currentStreak: streakStats.currentStreak || 0,
        longestStreak: streakStats.longestStreak || 0,
        multiplier: streakStats.multiplier || 1.0,
        nextResetTime: streakStats.nextReset || streakStats.nextResetTime || '24h 0m'
      },

      // Daily Quests
      dailyQuests: {
        completed: dailyQuestsCompleted,
        total: dailyQuestsTotal,
        completionRate: completionRate,
        available: dailyQuests.filter(q => q.isAvailable && !q.isCompleted).length
      },

      // Social Quests
      socialQuests: {
        created: socialQuestsCreated,
        active: socialQuestsActive,
        participatedPending: socialQuestsParticipatedPending,
        participatedApproved: socialQuestsParticipatedApproved,
        participatedRejected: socialQuestsParticipatedRejected
      },

      // My Created Quests
      myQuests: myQuestsWithStats,

      // Pending Participations (for user to see their pending participations)
      pendingParticipations: pendingParticipations.map(p => ({
        id: p._id,
        quest: p.quest ? {
          id: p.quest._id,
          title: p.quest.title,
          template: p.quest.template,
          tiktokProfile: p.quest.tiktokProfile || null
        } : null,
        createdAt: p.createdAt
      })),

      // Recent Activities
      recentActivities: recentActivities.length > 0 ? recentActivities : [
        {
          id: 'empty',
          title: 'ยังไม่มีกิจกรรมล่าสุด',
          points: 0,
          time: '',
          type: 'empty'
        }
      ],

      // Timestamp
      lastUpdated: new Date()
    };

    console.log('✅ Dashboard data loaded:', {
      points: dashboardData.points,
      streak: dashboardData.streak.currentStreak,
      dailyQuests: `${dashboardData.dailyQuests.completed}/${dashboardData.dailyQuests.total}`
    });

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการโหลดแดชบอร์ด'
    });
  }
});

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(date) {
  if (!date) return 'ไม่ทราบเวลา';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  return `${Math.floor(diffInSeconds / 604800)} สัปดาห์ที่แล้ว`;
}

module.exports = router;
