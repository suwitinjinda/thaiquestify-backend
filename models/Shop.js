// backend/models/Shop.js
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: false, // Will be generated when approved
    unique: true,
    sparse: true, // Allow null values for uniqueness
    maxlength: 6
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partnerCode: {
    type: String,
    required: true
  },
  // ✅ ADD SHOP OWNER FIELD - This links to the user who owns/manages the shop
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ownerEmail: {
    type: String,
    required: false,
    trim: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  shopType: {
    type: String,
    required: true,
    enum: ['Restaurant/Cafe', 'Retail Store', 'Service Business', 'Hotel/Accommodation', 'Tour Operator', 'Other']
  },
  taxId: {
    type: String,
    sparse: true
  },
  province: {
    type: String,
    required: true
  },
  district: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  images: [{
    type: String, // GCP bucket URL
    default: []
  }],
  phone: {
    type: String,
    required: true
  },
  businessHours: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'suspended'],
    default: 'pending'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  settings: {
    commissionRate: {
      type: Number,
      default: 10
    },
    autoApproveQuests: {
      type: Boolean,
      default: false
    }
  },
  // ✅ ADD BALANCE FIELDS for financial tracking
  balance: {
    type: Number,
    default: 0
  },
  reservedBalance: {
    type: Number,
    default: 0
  },
  // ✅ ADD ACTIVITY TRACKING
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
shopSchema.index({ partnerId: 1 });
shopSchema.index({ user: 1 }); // ✅ ADD INDEX FOR SHOP OWNER
shopSchema.index({ shopId: 1 });
shopSchema.index({ status: 1 });
shopSchema.index({ province: 1 });
shopSchema.index({ ownerEmail: 1 }); // ✅ ADD INDEX FOR OWNER EMAIL

// ✅ ADD VIRTUAL FOR QUEST COUNT
shopSchema.virtual('questCount', {
  ref: 'Quest',
  localField: '_id',
  foreignField: 'shop',
  count: true
});

// ✅ ADD METHOD TO CHECK IF SHOP CAN CREATE QUESTS
shopSchema.methods.canCreateQuest = function() {
  return this.status === 'active' && this.isActive && !this.isDeleted;
};

// ✅ ADD STATIC METHOD TO FIND ACTIVE SHOPS
shopSchema.statics.findActiveShops = function() {
  return this.find({ 
    status: 'active', 
    isActive: true, 
    isDeleted: { $ne: true } 
  });
};

// ✅ ENSURE VIRTUAL FIELDS ARE INCLUDED IN JSON
shopSchema.set('toJSON', { virtuals: true });
shopSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shop', shopSchema);