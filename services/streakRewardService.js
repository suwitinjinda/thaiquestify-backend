// services/streakRewardService.js
const User = require('../models/User');
const StreakSettings = require('../models/StreakSettings');
const PointSystem = require('../models/PointSystem');
const PointTransaction = require('../models/PointTransaction');

/**
 * Check and award streak milestone rewards
 * Called when user's streak is updated
 */
async function checkAndAwardStreakMilestones(userId, newStreak) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.streakStats) {
      return { awarded: false, message: 'User or streak stats not found' };
    }

    // Get streak milestone settings
    const streak7Days = await StreakSettings.findOne({ key: 'streak_7_days_points' });
    const streak14Days = await StreakSettings.findOne({ key: 'streak_14_days_points' });
    const streak30Days = await StreakSettings.findOne({ key: 'streak_30_days_points' });

    const milestones = [
      { days: 7, points: streak7Days?.value || 10, key: 'streak_7_days' },
      { days: 14, points: streak14Days?.value || 50, key: 'streak_14_days' },
      { days: 30, points: streak30Days?.value || 100, key: 'streak_30_days' }
    ];

    let totalAwarded = 0;
    const awardedMilestones = [];

    // Check each milestone
    for (const milestone of milestones) {
      // Check if user just reached this milestone (exact match)
      if (newStreak === milestone.days) {
        // Check if already awarded (track in user.streakStats.awardedMilestones)
        if (!user.streakStats.awardedMilestones) {
          user.streakStats.awardedMilestones = [];
        }

        if (!user.streakStats.awardedMilestones.includes(milestone.key)) {
          // Award points
          const pointSystem = await PointSystem.getSystem();
          const hasEnoughPoints = await pointSystem.hasEnoughPoints(milestone.points);

          if (hasEnoughPoints) {
            // Use points from system
            await pointSystem.usePoints(milestone.points, userId, {
              type: 'streak_milestone',
              milestone: milestone.key,
              streakDays: milestone.days
            });

            // Add points to user
            user.points = (user.points || 0) + milestone.points;
            user.streakStats.awardedMilestones.push(milestone.key);

            totalAwarded += milestone.points;
            awardedMilestones.push({
              days: milestone.days,
              points: milestone.points
            });

            console.log(`🎉 Streak milestone ${milestone.days} days reached! Awarded ${milestone.points} points to user ${userId}`);
          } else {
            console.warn(`⚠️ Not enough points in system to award streak milestone ${milestone.days} days`);
          }
        }
      }
    }

    if (totalAwarded > 0) {
      await user.save();
      return {
        awarded: true,
        totalPoints: totalAwarded,
        milestones: awardedMilestones
      };
    }

    return { awarded: false, message: 'No new milestones reached' };
  } catch (error) {
    console.error('❌ Error checking streak milestones:', error);
    return { awarded: false, error: error.message };
  }
}

module.exports = {
  checkAndAwardStreakMilestones
};
