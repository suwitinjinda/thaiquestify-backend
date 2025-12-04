// backend/models/Partner.js
const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  partnerCode: {
    type: String,
    required: true,
    unique: true
  },
  companyName: String,
  taxId: String,
  address: String,
  phone: String,
  totalCommission: {
    type: Number,
    default: 0
  },
  pendingCommission: {
    type: Number,
    default: 0
  },
  shops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  }],
  settings: {
    autoApproveShops: {
      type: Boolean,
      default: false
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Partner', partnerSchema);