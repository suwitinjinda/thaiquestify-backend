// backend/models/Quest.js
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestTemplate' },

  // Shop reference (use both shopId and shop ObjectId)
  shopId: { type: String, required: false }, // The shop ID string (optional for tourist quests)
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false }, // Shop reference (optional for tourist quests)

  // Tourist quest reference (for tourist attraction quests)
  touristId: { type: String, required: false }, // Tourist attraction ID

  // Quest configuration
  budget: { type: Number, required: true },
  rewardAmount: { type: Number, required: true },
  rewardPoints: { type: Number, default: 10 },
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  duration: { type: Number, default: 7 }, // in days

  // Quest type and verification
  type: {
    type: String,
    enum: ['social_media', 'website_visit', 'content_creation', 'product_review', 'location_checkin', 'facebook_follow'],
    default: 'social_media'
  },
  verificationMethod: {
    type: String,
    enum: ['screenshot', 'manual_review', 'link_click', 'api_verification', 'location_verification', 'facebook_api'],
    default: 'screenshot'
  },
  instructions: { type: String },
  category: { type: String },
  estimatedTime: { type: Number },
  tags: [{ type: String }],
  requiredData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Facebook-specific fields
  facebookPageId: { type: String },
  facebookPageName: { type: String },
  facebookPageUrl: { type: String },

  // Location-specific fields
  locationName: { type: String },
  address: { type: String },
  coordinates: { type: String },
  radius: { type: Number, default: 100 },

  // Tourist quest fields
  isTouristQuest: { type: Boolean, default: false },
  touristAttractionId: { type: String },
  isOneTimeQuest: { type: Boolean, default: false },

  // Quest status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  totalSpent: { type: Number, default: 0 },
  qrCode: { type: String },
  submissions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    evidence: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending'
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: { type: String }
  }],

  // Metadata
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
questSchema.index({ shopId: 1, status: 1 });
questSchema.index({ type: 1, isActive: 1 });
questSchema.index({ endDate: 1 });
questSchema.index({ createdBy: 1 });

// Virtual for days remaining
questSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

module.exports = mongoose.model('Quest', questSchema);

// Generate unique QR code before saving
questSchema.pre('save', async function (next) {
  // Calculate end date based on duration
  if (this.isModified('duration') || this.isNew) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + this.duration);
  }

  // Generate unique QR code if not provided
  if (!this.qrCode) {
    this.qrCode = await generateUniqueQRCode();
  }

  next();
});

// Function to generate unique QR code
async function generateUniqueQRCode() {
  const Quest = mongoose.model('Quest');
  let isUnique = false;
  let qrCode;

  while (!isUnique) {
    // Generate random QR code (you can use any format you prefer)
    qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if QR code already exists
    const existingQuest = await Quest.findOne({ qrCode });
    if (!existingQuest) {
      isUnique = true;
    }
  }

  return qrCode;
}

// Calculate end date based on duration
questSchema.pre('save', function (next) {
  if (this.isModified('duration') || this.isNew) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + this.duration);
  }
  next();
});

// Update total spent when submissions are approved
questSchema.methods.updateTotalSpent = async function () {
  const approvedCount = this.submissions.filter(sub => sub.status === 'approved').length;
  this.totalSpent = approvedCount * this.rewardAmount;
  await this.save();
};

// Soft delete method
questSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.isActive = false;
  this.status = 'cancelled';
  await this.save();
};

// Only include non-deleted quests by default
questSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Quest', questSchema);