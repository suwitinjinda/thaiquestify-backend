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
  // Shop mode: online, offline, or both
  shopMode: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'both'
  },
  // Shop open/close status
  isOpen: {
    type: Boolean,
    default: true
  },
  // Delivery option: self (ส่งของด้วยตัวเอง), accept_delivery (รับคนส่งของ), both
  deliveryOption: {
    type: String,
    enum: ['self', 'accept_delivery', 'both'],
    default: 'both'
  },
  // Delivery radius in kilometers (ใช้เมื่อต้องการพนักงานส่งอาหาร)
  // Default value will be set from QuestSettings in pre-save hook
  deliveryRadiusKm: {
    type: Number,
    default: null,
    min: 0
  },
  // Delivery price that shop is willing to pay (ต้องไม่ต่ำกว่าที่ admin กำหนด)
  // Default value will be set from QuestSettings in pre-save hook
  deliveryPrice: {
    type: Number,
    default: null,
    min: 0
  },
  // Bank account information for withdrawal/deposit
  bankAccount: {
    accountName: {
      type: String,
      default: '',
      trim: true
    },
    accountNumber: {
      type: String,
      default: '',
      trim: true
    },
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    bankBranch: {
      type: String,
      default: '',
      trim: true
    }
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

// Pre-save hook: Set default delivery values from QuestSettings if not provided
shopSchema.pre('save', async function(next) {
  // Only set defaults if this is a new document or values are null/undefined
  if (this.isNew || this.deliveryPrice === null || this.deliveryPrice === undefined || 
      this.deliveryRadiusKm === null || this.deliveryRadiusKm === undefined) {
    try {
      const QuestSettings = require('./QuestSettings');
      
      // Set default delivery price if not provided
      if (this.deliveryPrice === null || this.deliveryPrice === undefined) {
        const defaultPrice = await QuestSettings.getSetting('delivery_min_price');
        if (defaultPrice !== null && defaultPrice !== undefined) {
          this.deliveryPrice = defaultPrice;
          console.log(`✅ Set default deliveryPrice to ${defaultPrice} from QuestSettings`);
        }
      }
      
      // Set default delivery radius if not provided
      if (this.deliveryRadiusKm === null || this.deliveryRadiusKm === undefined) {
        const defaultRadius = await QuestSettings.getSetting('delivery_default_radius_km');
        if (defaultRadius !== null && defaultRadius !== undefined) {
          this.deliveryRadiusKm = defaultRadius;
          console.log(`✅ Set default deliveryRadiusKm to ${defaultRadius} from QuestSettings`);
        } else {
          // Fallback to 10 if setting doesn't exist
          this.deliveryRadiusKm = 10;
        }
      }
    } catch (error) {
      console.error('❌ Error setting default delivery values from QuestSettings:', error);
      // Continue with save even if settings can't be loaded
    }
  }
  next();
});

module.exports = mongoose.model('Shop', shopSchema);