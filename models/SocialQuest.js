const mongoose = require('mongoose');

const socialQuestSchema = new mongoose.Schema({
  // Owner information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Quest template type
  template: {
    type: String,
    enum: ['tiktok_follow', 'tiktok_share_url'],
    default: 'tiktok_follow',
    required: true
  },

  // Quest title and description
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // TikTok profile information (for tiktok_follow template)
  tiktokProfile: {
    username: { type: String, default: null },
    displayName: { type: String, default: '' },
    profileUrl: { type: String, default: null },
    avatarUrl: { type: String, default: '' },
    openId: { type: String, default: null }, // For verification
  },

  // TikTok Share URL information (for tiktok_share_url template)
  tiktokShareUrl: {
    url: { type: String, default: null }, // TikTok video/post URL
    actionType: { 
      type: String, 
      enum: ['like', 'comment', 'both'], 
      default: 'like' 
    }, // What user needs to do: like, comment, or both
    videoId: { type: String, default: null }, // Extract from URL for verification
    thumbnailUrl: { type: String, default: '' },
  },

  // Points configuration
  pointsReward: {
    type: Number,
    required: true,
    min: 1,
    default: 10
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 1,
    default: 5 // Owner pays this to create quest
  },

  // Quest status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'expired', 'cancelled', 'rejected'],
    default: 'pending', // New quests need approval
    index: true
  },
  
  // Approval information (for admin approval)
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  // Participation limits
  maxParticipants: {
    type: Number,
    default: null, // null = unlimited
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },

  // Timestamps
  expiresAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for performance
socialQuestSchema.index({ owner: 1, status: 1 });
socialQuestSchema.index({ status: 1, createdAt: -1 });
socialQuestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired quests

// Method to check if quest is active
socialQuestSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) return false;
  return true;
};

// Method to increment participant count
socialQuestSchema.methods.addParticipant = async function() {
  this.currentParticipants += 1;
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  await this.save();
};

// Collection name: 'socialquests' - สำหรับเควสจากชุมชน (TikTok follow, share URL)
module.exports = mongoose.model('SocialQuest', socialQuestSchema, 'socialquests');
