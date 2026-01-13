// models/RewardRedemption.js
const mongoose = require('mongoose');

/**
 * RewardRedemption Model
 * Tracks user reward redemptions (milestone rewards, point redemptions, etc.)
 */
const rewardRedemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rewardId: {
    type: String,
    required: true,
    index: true
  },
  rewardName: {
    type: String,
    required: true
  },
  rewardType: {
    type: String,
    enum: ['milestone', 'points', 'streak', 'vip', 'cash'],
    required: true
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  streakRequired: {
    type: Number,
    default: null
  },
  streakAtRedemption: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  redeemedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
rewardRedemptionSchema.index({ user: 1, redeemedAt: -1 });
rewardRedemptionSchema.index({ user: 1, rewardId: 1 }); // Prevent duplicate claims

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);

module.exports = RewardRedemption;
