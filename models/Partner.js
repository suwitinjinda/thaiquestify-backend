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
    unique: true,
    sparse: true
  },
  
  // Registration Status
  status: {
    type: String,
    enum: ['pending', 'probation', 'approved', 'rejected'],
    default: 'pending'
  },
  // Probation (ทดลองงาน) Status
  probationStatus: {
    type: String,
    enum: ['active', 'passed', null],
    default: null
  },
  probationStartedAt: {
    type: Date,
    default: null
  },
  probationPassedAt: {
    type: Date,
    default: null
  },
  probationPassedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedReason: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Personal Information
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    idCard: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{13}$/.test(v);
        },
        message: 'ID Card must be exactly 13 digits'
      }
    }
  },
  
  // Working Area
  workingArea: {
    province: { type: String, required: true },
    district: { type: String, required: true },
    subdistrict: { type: String, default: '' }
  },
  
  // Social Media Information
  socialMedia: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    line: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  
  // Bank Account Information
  bankAccount: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true }
  },
  
  // Additional Information
  additionalInfo: {
    reason: { type: String, default: '' }
  },
  
  // Commission & Shops (existing)
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