// server/models/Redemption.js
const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    required: true
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  saleAmount: Number,
  discountAmount: Number,
  commissionAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  qrCodeScanned: String,
  redeemedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
redemptionSchema.index({ user: 1, quest: 1 });
redemptionSchema.index({ partner: 1, status: 1 });

module.exports = mongoose.model('Redemption', redemptionSchema);