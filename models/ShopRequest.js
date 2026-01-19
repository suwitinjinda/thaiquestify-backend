// backend/models/ShopRequest.js
const mongoose = require('mongoose');

const shopRequestSchema = new mongoose.Schema({
  // Basic information from user
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  tel: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: String,
    required: true,
    trim: true
  },
  
  // User who submitted the request (optional - might be anonymous)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Status: pending (waiting for partner), contacted (partner contacted), submitted (partner submitted form, waiting admin approval), registered (admin approved), rejected
  status: {
    type: String,
    enum: ['pending', 'contacted', 'submitted', 'registered', 'rejected'],
    default: 'pending'
  },
  
  // Partner who will handle this request (assigned when partner contacts)
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Partner assigned to this request (random assignment)
  assignedPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // Partner code assigned to this request (for easier identification)
  assignedPartnerCode: {
    type: String,
    default: null,
    index: true
  },
  
  // When partner was assigned
  assignedAt: {
    type: Date,
    default: null
  },
  
  // Cooldown until this time (4 hours from assignment)
  cooldownUntil: {
    type: Date,
    default: null,
    index: true
  },
  
  // Shop registered from this request (when status is 'registered')
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null
  },
  
  // Additional notes from partner
  notes: {
    type: String,
    default: ''
  },
  
  // When partner contacted the user
  contactedAt: {
    type: Date,
    default: null
  },
  
  // When shop was registered
  registeredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
shopRequestSchema.index({ status: 1, partnerId: 1 });
shopRequestSchema.index({ userId: 1 });

module.exports = mongoose.model('ShopRequest', shopRequestSchema);
