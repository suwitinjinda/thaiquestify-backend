// routes/rewards.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const StreakSettings = require('../models/StreakSettings');
const QuestSettings = require('../models/QuestSettings');
const pointSystemService = require('../services/pointSystemService');
const PointTransaction = require('../models/PointTransaction');
const RewardRedemption = require('../models/RewardRedemption');
const CashReward = require('../models/CashReward');
const Shop = require('../models/Shop');
const Job = require('../models/Job');
const Reward = require('../models/Reward');
const PointSystem = require('../models/PointSystem');

/**
 * POST /api/v2/rewards/claim-milestone
 * Claim a streak milestone reward
 */
router.post('/claim-milestone', auth, async (req, res) => {
  try {
    const { milestoneId } = req.body; // 'streak_7', 'streak_14', 'streak_30'
    const userId = req.user.id;

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ milestone ID'
      });
    }

    // Get user with streak stats
    const user = await User.findById(userId);
    if (!user || !user.streakStats) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้หรือ streak stats'
      });
    }

    // Map milestone ID to days and points
    const milestoneMap = {
      'streak_7': { days: 7, key: 'streak_7_days', settingKey: 'streak_7_days_points' },
      'streak_14': { days: 14, key: 'streak_14_days', settingKey: 'streak_14_days_points' },
      'streak_30': { days: 30, key: 'streak_30_days', settingKey: 'streak_30_days_points' }
    };

    const milestone = milestoneMap[milestoneId];
    if (!milestone) {
      return res.status(400).json({
        success: false,
        message: 'Milestone ID ไม่ถูกต้อง'
      });
    }

    // Check if user has reached the streak requirement
    const currentStreak = user.streakStats.currentStreak || 0;
    if (currentStreak < milestone.days) {
      return res.status(400).json({
        success: false,
        message: `คุณต้องทำ streak ${milestone.days} วัน แต่คุณมี streak ${currentStreak} วัน`
      });
    }

    // Check if already claimed
    if (!user.streakStats.awardedMilestones) {
      user.streakStats.awardedMilestones = [];
    }

    if (user.streakStats.awardedMilestones.includes(milestone.key)) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รับรางวัลนี้แล้ว'
      });
    }

    // Get points from settings
    const streakSetting = await StreakSettings.findOne({ key: milestone.settingKey });
    const pointsToAward = streakSetting?.value || (milestone.days === 7 ? 10 : milestone.days === 14 ? 50 : 100);

    // Check if system has enough points
    const hasEnoughPoints = await pointSystemService.hasEnoughPoints(pointsToAward);
    if (!hasEnoughPoints) {
      return res.status(400).json({
        success: false,
        message: 'ระบบไม่มีคะแนนเพียงพอ'
      });
    }

    // Use points from system
    await pointSystemService.usePoints(
      pointsToAward,
      userId,
      'streak_milestone',
      null,
      `Streak milestone ${milestone.days} days reward`
    );

    // Add points to user
    user.points = (user.points || 0) + pointsToAward;
    user.streakStats.awardedMilestones.push(milestone.key);
    await user.save();

    // Create redemption record
    const redemption = await RewardRedemption.create({
      user: userId,
      rewardId: milestoneId,
      rewardName: `รางวัล Streak ${milestone.days} วัน`,
      rewardType: 'milestone',
      pointsAwarded: pointsToAward,
      pointsUsed: 0,
      streakRequired: milestone.days,
      streakAtRedemption: currentStreak,
      description: `รับ ${pointsToAward} คะแนนเมื่อทำ streak ${milestone.days} วัน`
    });

    console.log(`🎉 User ${userId} claimed streak milestone ${milestone.days} days, awarded ${pointsToAward} points`);

    res.json({
      success: true,
      message: `รับรางวัล ${pointsToAward} คะแนนสำเร็จแล้ว`,
      data: {
        milestone: milestone.days,
        pointsAwarded: pointsToAward,
        newPoints: user.points,
        redemptionId: redemption._id
      }
    });
  } catch (error) {
    console.error('❌ Error claiming milestone reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับรางวัล'
    });
  }
});

/**
 * GET /api/v2/rewards/claimed-milestones
 * Get user's claimed milestone rewards
 * Uses redemption history as source of truth
 */
router.get('/claimed-milestones', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Define all milestone reward IDs (including special ones)
    const milestoneRewardIds = [
      'streak_7', 'streak_14', 'streak_30',
      'new_user_welcome_reward', 'first_shop_reward', 'first_job_reward', 'new_partner_reward'
    ];
    
    // Get claimed milestones from redemption history by rewardId (not rewardType)
    const redemptions = await RewardRedemption.find({ 
      user: userId,
      rewardId: { $in: milestoneRewardIds }
    }).select('rewardId');
    
    const claimedIds = redemptions.map(r => r.rewardId).filter(Boolean);
    
    // Also check user.streakStats.awardedMilestones as fallback
    const user = await User.findById(userId).select('streakStats.awardedMilestones');
    if (user && user.streakStats && user.streakStats.awardedMilestones) {
      const milestoneIdMap = {
        'streak_7_days': 'streak_7',
        'streak_14_days': 'streak_14',
        'streak_30_days': 'streak_30'
      };
      
      const fromUserStats = user.streakStats.awardedMilestones
        .map(key => milestoneIdMap[key])
        .filter(Boolean);
      
      // Merge both sources (remove duplicates)
      const allClaimed = [...new Set([...claimedIds, ...fromUserStats])];
      
      console.log(`[claimed-milestones] User ${userId}: fromRedemptions=${JSON.stringify(claimedIds)}, fromUserStats=${JSON.stringify(fromUserStats)}, merged=${JSON.stringify(allClaimed)}`);
      
      return res.json({
        success: true,
        data: allClaimed
      });
    }
    
    console.log(`[claimed-milestones] User ${userId}: fromRedemptions=${JSON.stringify(claimedIds)}`);

    res.json({
      success: true,
      data: claimedIds
    });
  } catch (error) {
    console.error('❌ Error getting claimed milestones:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/rewards/redemption-history
 * Get user's reward redemption history
 */
router.get('/redemption-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const redemptions = await RewardRedemption.find({ user: userId })
      .sort({ redeemedAt: -1 })
      .limit(100);

    const history = redemptions.map(redemption => ({
      id: redemption._id.toString(),
      rewardId: redemption.rewardId,
      rewardName: redemption.rewardName,
      rewardType: redemption.rewardType,
      pointsAwarded: redemption.pointsAwarded,
      pointsUsed: redemption.pointsUsed,
      streakRequired: redemption.streakRequired,
      streakAtRedemption: redemption.streakAtRedemption,
      description: redemption.description,
      redeemedAt: redemption.redeemedAt
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Error getting redemption history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/rewards/redeem-cash
 * Redeem cash reward (300 บาท for 500 points)
 */
router.post('/redeem-cash', auth, async (req, res) => {
  try {
    const { bankAccount } = req.body; // { accountName, accountNumber, bankName }
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Cash reward details
    const cashAmount = 300;
    const pointsRequired = 500;

    // All non-milestone rewards use default_reward_streak_required from admin settings
    const defaultStreakSetting = await StreakSettings.findOne({ key: 'default_reward_streak_required' });
    const defaultStreakRequired = defaultStreakSetting?.value || 14;
    const currentStreak = user.streakStats?.currentStreak || 0;

    if (defaultStreakRequired > 0 && currentStreak < defaultStreakRequired) {
      return res.status(400).json({
        success: false,
        message: `คุณต้องมี streak ${defaultStreakRequired} วัน แต่คุณมี streak ${currentStreak} วัน`
      });
    }

    // Check cash reward limit
    const cashRewardLimitSetting = await StreakSettings.findOne({ key: 'cash_reward_limit' });
    const cashRewardLimit = cashRewardLimitSetting?.value || 100;
    
    // Count total cash rewards redeemed (excluding rejected/cancelled)
    const totalRedeemed = await CashReward.countDocuments({
      status: { $nin: ['rejected', 'cancelled'] }
    });

    if (totalRedeemed >= cashRewardLimit) {
      return res.status(400).json({
        success: false,
        message: `รางวัลเงินสดครบจำนวนจำกัด ${cashRewardLimit} คนแล้ว ไม่สามารถแลกได้อีก`
      });
    }

    // Check if user has enough points
    if (user.points < pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `คุณต้องการ ${pointsRequired} คะแนน แต่คุณมีเพียง ${user.points} คะแนน`
      });
    }

    // Deduct points from user
    user.points = user.points - pointsRequired;
    await user.save();

    // Return points to system (refund to point system)
    // When user redeems cash, points are returned to the system pool
    const pointSystem = await PointSystem.getSystem();
    
    // Refund points back to system (decrease usedPoints, increase availablePoints)
    await pointSystem.refundPoints(pointsRequired, userId);

    // Create PointTransaction for refund
    await PointTransaction.create({
      type: 'refund',
      amount: pointsRequired,
      userId: userId,
      description: `Refund from cash reward redemption (${cashAmount} บาท)`,
      pointSystemState: {
        totalPoints: pointSystem.totalPoints,
        usedPoints: pointSystem.usedPoints,
        availablePoints: pointSystem.availablePoints
      },
      status: 'completed'
    });

    // Create CashReward record
    const cashReward = await CashReward.create({
      user: userId,
      rewardId: 'cash_300',
      rewardName: 'เงินสด 300 บาท',
      amount: cashAmount,
      pointsUsed: pointsRequired,
      status: 'pending',
      bankAccount: bankAccount || {}
    });

    // Create RewardRedemption record
    await RewardRedemption.create({
      user: userId,
      rewardId: 'cash_300',
      rewardName: 'เงินสด 300 บาท',
      rewardType: 'cash',
      pointsAwarded: 0,
      pointsUsed: pointsRequired,
      streakRequired: minimumStreak,
      streakAtRedemption: currentStreak,
      description: `แลกเงินสด ${cashAmount} บาท`
    });

    console.log(`💰 User ${userId} redeemed cash reward: ${cashAmount} บาท for ${pointsRequired} points`);

    res.json({
      success: true,
      message: `แลกรางวัลเงินสด ${cashAmount} บาทสำเร็จแล้ว รอการอนุมัติ`,
      data: {
        cashRewardId: cashReward._id,
        amount: cashAmount,
        pointsUsed: pointsRequired,
        newPoints: user.points,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('❌ Error redeeming cash reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการแลกรางวัล'
    });
  }
});

/**
 * GET /api/v2/rewards/my-cash-rewards
 * Get user's cash reward redemptions
 */
router.get('/my-cash-rewards', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cashRewards = await CashReward.find({ user: userId })
      .sort({ requestedAt: -1 })
      .limit(50);

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
 * GET /api/v2/rewards/settings
 * Get public reward settings (streak requirements, etc.)
 * Accessible to all authenticated users
 */
router.get('/settings', auth, async (req, res) => {
  try {
    // Get streak settings (public read-only access)
    const streakSettings = await StreakSettings.find({ isActive: true, category: 'streak' });
    
    // Get default streak requirement
    const defaultStreakSetting = streakSettings.find(s => s.key === 'default_reward_streak_required');
    
    // Get milestone points
    const milestoneSettings = {
      streak7Days: streakSettings.find(s => s.key === 'streak_7_days_points'),
      streak14Days: streakSettings.find(s => s.key === 'streak_14_days_points'),
      streak30Days: streakSettings.find(s => s.key === 'streak_30_days_points'),
    };

    // Get cash reward limit
    const cashRewardLimitSetting = streakSettings.find(s => s.key === 'cash_reward_limit');
    const cashRewardLimit = cashRewardLimitSetting?.value || 100;
    
    // Count total cash rewards redeemed (excluding rejected/cancelled)
    const totalRedeemed = await CashReward.countDocuments({
      status: { $nin: ['rejected', 'cancelled'] }
    });
    const remainingSlots = Math.max(0, cashRewardLimit - totalRedeemed);

    res.json({
      success: true,
      data: {
        defaultStreakRequired: defaultStreakSetting?.value || 14,
        milestones: {
          streak7: {
            days: 7,
            points: milestoneSettings.streak7Days?.value || 10
          },
          streak14: {
            days: 14,
            points: milestoneSettings.streak14Days?.value || 50
          },
          streak30: {
            days: 30,
            points: milestoneSettings.streak30Days?.value || 100
          }
        },
        minimumStreakRequired: (() => {
          const minSetting = streakSettings.find(s => s.key === 'minimum_streak_days_for_reward');
          return minSetting?.value || 0;
        })(),
        cashRewardLimit: cashRewardLimit,
        cashRewardRemaining: remainingSlots,
        cashRewardRedeemed: totalRedeemed
      }
    });
  } catch (error) {
    console.error('❌ Error getting reward settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * POST /api/v2/rewards/claim-welcome
 * Claim welcome reward for new users
 */
router.post('/claim-welcome', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check if already claimed
    const existingRedemption = await RewardRedemption.findOne({
      user: userId,
      rewardId: 'new_user_welcome_reward'
    });

    if (existingRedemption) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รับรางวัลต้อนรับผู้ใช้ใหม่แล้ว'
      });
    }

    // Check if user is new (created within last 30 days)
    const daysSinceSignup = (new Date() - user.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup > 30) {
      return res.status(400).json({
        success: false,
        message: 'รางวัลต้อนรับผู้ใช้ใหม่สามารถรับได้เฉพาะผู้ใช้ใหม่เท่านั้น (ภายใน 30 วัน)'
      });
    }

    // Get reward points from admin setting: reward tab => รางวัลต้อนรับผู้ใช้ใหม่ (new_user_welcome_reward_points). No streak condition.
    const rewardSetting = await QuestSettings.findOne({ key: 'new_user_welcome_reward_points' });
    const pointsToAward = rewardSetting?.value || 500; // Default 500 points

    // Deduct from PointSystem (platform pays)
    const pointSystem = await PointSystem.getSystem();
    await pointSystem.usePoints(pointsToAward, userId);

    // Add points to user (platform pays to user)
    user.points = (user.points || 0) + pointsToAward;
    await user.save();

    // Create PointTransaction (positive amount for user - user receives)
    await PointTransaction.create({
      type: 'reward',
      amount: pointsToAward, // Positive: user receives
      userId: userId,
      description: 'ได้รับรางวัลต้อนรับผู้ใช้ใหม่',
      status: 'completed'
    });

    // Create redemption record
    const redemption = await RewardRedemption.create({
      user: userId,
      rewardId: 'new_user_welcome_reward',
      rewardName: 'รางวัลต้อนรับผู้ใช้ใหม่',
      rewardType: 'points',
      pointsAwarded: pointsToAward,
      pointsUsed: 0,
      description: `รับ ${pointsToAward} คะแนนต้อนรับผู้ใช้ใหม่`
    });

    console.log(`🎉 User ${userId} claimed welcome reward, awarded ${pointsToAward} points`);

    res.json({
      success: true,
      message: `รับรางวัลต้อนรับผู้ใช้ใหม่ ${pointsToAward} คะแนนสำเร็จแล้ว`,
      data: {
        pointsAwarded: pointsToAward,
        newPoints: user.points,
        redemptionId: redemption._id
      }
    });
  } catch (error) {
    console.error('❌ Error claiming welcome reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับรางวัล'
    });
  }
});

/**
 * POST /api/v2/rewards/claim-first-shop
 * Claim first shop reward (auto-claimed when first shop is created)
 */
router.post('/claim-first-shop', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check if already claimed
    const existingRedemption = await RewardRedemption.findOne({
      user: userId,
      rewardId: 'first_shop_reward'
    });

    if (existingRedemption) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รับรางวัลร้านค้าแรกแล้ว'
      });
    }

    // Check if user has at least one shop
    // Shop model has 'user' field, 'partnerId', and 'ownerEmail' (not 'owner')
    const shopCount = await Shop.countDocuments({ 
      $or: [
        { user: userId },
        { partnerId: userId },
        { ownerEmail: user.email }
      ]
    });
    if (shopCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'คุณยังไม่มีร้านค้า'
      });
    }

    // Get reward points from admin setting: reward tab => รางวัลร้านค้าแรก (first_shop_reward_points). No streak condition.
    const rewardSetting = await QuestSettings.findOne({ key: 'first_shop_reward_points' });
    const pointsToAward = rewardSetting?.value || 500; // Default 500 points

    // Deduct from PointSystem (platform pays)
    const pointSystem = await PointSystem.getSystem();
    await pointSystem.usePoints(pointsToAward, userId);

    // Add points to user (platform pays to user)
    user.points = (user.points || 0) + pointsToAward;
    await user.save();

    // Create PointTransaction (positive amount for user - user receives)
    await PointTransaction.create({
      type: 'reward',
      amount: pointsToAward, // Positive: user receives
      userId: userId,
      description: 'ได้รับรางวัลร้านค้าแรก',
      status: 'completed'
    });

    // Create redemption record
    const redemption = await RewardRedemption.create({
      user: userId,
      rewardId: 'first_shop_reward',
      rewardName: 'รางวัลร้านค้าแรก',
      rewardType: 'points',
      pointsAwarded: pointsToAward,
      pointsUsed: 0,
      description: `รับ ${pointsToAward} คะแนนเมื่อสร้างร้านค้าแรก`
    });

    console.log(`🎉 User ${userId} claimed first shop reward, awarded ${pointsToAward} points`);

    res.json({
      success: true,
      message: `รับรางวัลร้านค้าแรก ${pointsToAward} คะแนนสำเร็จแล้ว`,
      data: {
        pointsAwarded: pointsToAward,
        newPoints: user.points,
        redemptionId: redemption._id
      }
    });
  } catch (error) {
    console.error('❌ Error claiming first shop reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับรางวัล'
    });
  }
});

/**
 * POST /api/v2/rewards/claim-new-partner
 * Claim new partner reward (auto-claimed when becoming a partner)
 */
router.post('/claim-new-partner', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check if user is a partner
    if (!user.partnerId && !user.partnerCode) {
      return res.status(400).json({
        success: false,
        message: 'คุณยังไม่ใช่ Partner'
      });
    }

    // Check if already claimed
    const existingRedemption = await RewardRedemption.findOne({
      user: userId,
      rewardId: 'new_partner_reward'
    });

    if (existingRedemption) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รับรางวัล Partner หน้าใหม่แล้ว'
      });
    }

    // Get reward points from admin setting: reward tab => รางวัล Partner หน้าใหม่ (new_partner_reward_points). No streak condition.
    const rewardSetting = await QuestSettings.findOne({ key: 'new_partner_reward_points' });
    const pointsToAward = rewardSetting?.value || 500; // Default 500 points

    // Deduct from PointSystem (platform pays)
    const pointSystem = await PointSystem.getSystem();
    await pointSystem.usePoints(pointsToAward, userId);

    // Add points to user (platform pays to user)
    user.points = (user.points || 0) + pointsToAward;
    await user.save();

    // Create PointTransaction (positive amount for user - user receives)
    await PointTransaction.create({
      type: 'reward',
      amount: pointsToAward, // Positive: user receives
      userId: userId,
      description: 'ได้รับรางวัล Partner หน้าใหม่',
      status: 'completed'
    });

    // Create redemption record
    const redemption = await RewardRedemption.create({
      user: userId,
      rewardId: 'new_partner_reward',
      rewardName: 'รางวัล Partner หน้าใหม่',
      rewardType: 'points',
      pointsAwarded: pointsToAward,
      pointsUsed: 0,
      description: `รับ ${pointsToAward} คะแนนเมื่อเป็น Partner หน้าใหม่`
    });

    console.log(`🎉 User ${userId} claimed new partner reward, awarded ${pointsToAward} points`);

    res.json({
      success: true,
      message: `รับรางวัล Partner หน้าใหม่ ${pointsToAward} คะแนนสำเร็จแล้ว`,
      data: {
        pointsAwarded: pointsToAward,
        newPoints: user.points,
        redemptionId: redemption._id
      }
    });
  } catch (error) {
    console.error('❌ Error claiming new partner reward:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการรับรางวัล'
    });
  }
});

/**
 * GET /api/v2/rewards/available
 * Get list of available rewards for the user
 */
router.get('/available', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Get all claimed rewards
    const claimedRewards = await RewardRedemption.find({ user: userId })
      .select('rewardId');
    const claimedIds = claimedRewards.map(r => r.rewardId);

    // Get reward settings
    const welcomeReward = await QuestSettings.findOne({ key: 'new_user_welcome_reward_points' });
    const firstShopReward = await QuestSettings.findOne({ key: 'first_shop_reward_points' });
    const newPartnerReward = await QuestSettings.findOne({ key: 'new_partner_reward_points' });

    // Check conditions
    const daysSinceSignup = (new Date() - user.createdAt) / (1000 * 60 * 60 * 24);
    // Shop model has 'user' field (not 'owner'), also check 'partnerId' and 'ownerEmail'
    const shopCount = await Shop.countDocuments({ 
      $or: [
        { user: userId },
        { partnerId: userId },
        { ownerEmail: user.email }
      ]
    });
    const isPartner = !!(user.partnerId || user.partnerCode);

    const availableRewards = [];

    // Welcome reward
    if (!claimedIds.includes('new_user_welcome_reward') && daysSinceSignup <= 30) {
      availableRewards.push({
        rewardId: 'new_user_welcome_reward',
        rewardName: 'รางวัลต้อนรับผู้ใช้ใหม่',
        points: welcomeReward?.value || 500,
        description: 'รับคะแนนต้อนรับเมื่อสมัครใหม่',
        canClaim: true
      });
    }

    // First shop reward
    if (!claimedIds.includes('first_shop_reward') && shopCount > 0) {
      availableRewards.push({
        rewardId: 'first_shop_reward',
        rewardName: 'รางวัลร้านค้าแรก',
        points: firstShopReward?.value || 500,
        description: 'รับคะแนนเมื่อสร้างร้านค้าแรก',
        canClaim: true
      });
    }

    // New partner reward
    if (!claimedIds.includes('new_partner_reward') && isPartner) {
      availableRewards.push({
        rewardId: 'new_partner_reward',
        rewardName: 'รางวัล Partner หน้าใหม่',
        points: newPartnerReward?.value || 500,
        description: 'รับคะแนนเมื่อเป็น Partner หน้าใหม่',
        canClaim: true
      });
    }

    res.json({
      success: true,
      data: {
        availableRewards,
        claimedCount: claimedIds.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting available rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาด'
    });
  }
});

/**
 * GET /api/v2/rewards
 * Get all active rewards (for users to view and claim).
 * For reward tab items (รางวัลต้อนรับผู้ใช้ใหม่, รางวัลร้านค้าแรก, รางวัล Partner หน้าใหม่),
 * points and streak come from admin settings; no streak condition.
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get only active rewards, sorted by order
    let rewards = await Reward.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .select('rewardId name description category pointsRequired streakRequired cashAmount isMilestone image order')
      .lean();

    const welcomeSetting = await QuestSettings.findOne({ key: 'new_user_welcome_reward_points' });
    const firstShopSetting = await QuestSettings.findOne({ key: 'first_shop_reward_points' });
    const newPartnerSetting = await QuestSettings.findOne({ key: 'new_partner_reward_points' });

    rewards = rewards.map((r) => {
      const rid = r.rewardId || r._id?.toString();
      if (rid === 'new_user_welcome_reward') {
        return { ...r, pointsRequired: welcomeSetting?.value ?? r.pointsRequired ?? 500, streakRequired: 0 };
      }
      if (rid === 'first_shop_reward') {
        return { ...r, pointsRequired: firstShopSetting?.value ?? r.pointsRequired ?? 500, streakRequired: 0 };
      }
      if (rid === 'new_partner_reward') {
        return { ...r, pointsRequired: newPartnerSetting?.value ?? r.pointsRequired ?? 500, streakRequired: 0 };
      }
      return r;
    });

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

module.exports = router;
