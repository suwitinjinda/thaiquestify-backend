// backend/models/UserQuest.js
const mongoose = require('mongoose');

const userQuestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    required: true
  },
  questName: {
    type: String,
    required: true
  },
  shopId: {
    type: String,
    required: true
  },
  rewardAmount: {
    type: Number,
    required: true
  },
  rewardPoints: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['participating', 'completed', 'failed', 'cancelled'],
    default: 'participating'
  },
  verificationData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  submissionData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

userQuestSchema.index({ userId: 1, questId: 1 }, { unique: true });
userQuestSchema.index({ status: 1 });
userQuestSchema.index({ joinedAt: -1 });

module.exports = mongoose.model('UserQuest', userQuestSchema);