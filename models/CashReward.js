// models/CashReward.js
const mongoose = require('mongoose');

/**
 * CashReward Model
 * Tracks cash reward redemptions (เงินสด)
 */
const cashRewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rewardId: {
    type: String,
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  pointsUsed: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  bankAccount: {
    accountName: String,
    accountNumber: String,
    bankName: String
  },
  adminNotes: {
    type: String,
    default: ''
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cashRewardSchema.index({ user: 1, requestedAt: -1 });
cashRewardSchema.index({ status: 1, requestedAt: -1 });

const CashReward = mongoose.model('CashReward', cashRewardSchema);

module.exports = CashReward;
