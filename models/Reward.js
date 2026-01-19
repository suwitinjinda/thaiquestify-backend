// models/Reward.js
const mongoose = require('mongoose');

/**
 * Reward Model
 * Stores all available rewards in the system (streak rewards, cash rewards, etc.)
 * Admin can activate/deactivate rewards
 */
const rewardSchema = new mongoose.Schema({
  rewardId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['streak', 'cash', 'discount', 'giftcard', 'vip', 'milestone'],
    required: true,
    index: true
  },
  pointsRequired: {
    type: Number,
    default: 0,
    min: 0
  },
  streakRequired: {
    type: Number,
    default: null,
    min: 0
  },
  cashAmount: {
    type: Number,
    default: null,
    min: 0
  },
  isMilestone: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: null
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  // Display order
  order: {
    type: Number,
    default: 0
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Admin who last modified
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
rewardSchema.index({ category: 1, active: 1 });
rewardSchema.index({ active: 1, order: 1 });

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = Reward;
