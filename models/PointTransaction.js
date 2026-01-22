const mongoose = require('mongoose');

/**
 * PointTransaction Model
 * Tracks all point transactions (claims, refunds, adjustments)
 */
const pointTransactionSchema = new mongoose.Schema({
  // Transaction type
  type: {
    type: String,
    required: true,
    enum: ['claim', 'refund', 'adjustment', 'new_user', 'tourist_quest', 'admin_adjustment', 'streak_milestone', 'job_application_fee', 'job_commission_fee', 'reward', 'deduction', 'order_delivery'],
    index: true
  },
  
  // Amount of points
  // Positive = user receives points (reward, refund, etc.)
  // Negative = user pays points (fee, etc.)
  amount: {
    type: Number,
    required: true
  },
  
  // User who claimed/received points (if applicable)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Quest ID (if related to quest)
  questId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest'
  },
  
  // Tourist quest ID (if related to tourist quest)
  touristQuestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TouristQuest'
  },
  
  // Related ID (for coupon, order, or other entities)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    default: null
  },
  
  // Related model name (Coupon, Order, etc.)
  relatedModel: {
    type: String,
    enum: ['Coupon', 'Order', 'Delivery', null],
    default: null
  },
  
  // Remaining points after transaction
  remainingPoints: {
    type: Number,
    default: null
  },
  
  // Description/notes
  description: {
    type: String,
    default: ''
  },
  
  // Admin who made the transaction (if applicable)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Point system state after transaction
  pointSystemState: {
    totalPoints: Number,
    usedPoints: Number,
    availablePoints: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pointTransactionSchema.index({ userId: 1, createdAt: -1 });
pointTransactionSchema.index({ type: 1, createdAt: -1 });
pointTransactionSchema.index({ status: 1, createdAt: -1 });

const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);

module.exports = PointTransaction;
