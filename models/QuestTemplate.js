// backend/models/QuestTemplate.js
const mongoose = require('mongoose');

const questTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'social_media', 
      'website_visit', 
      'content_creation', 
      'product_review', 
      'location_checkin',
      'facebook_follow'
    ],
    default: 'social_media'
  },
  instructions: { type: String, required: true },
  verificationMethod: {
    type: String,
    required: true,
    enum: [
      'screenshot', 
      'manual_review', 
      'link_click', 
      'api_verification', 
      'location_verification',
      'facebook_api'
    ],
    default: 'screenshot'
  },
  rewardPoints: { type: Number, required: true, default: 0 },
  rewardAmount: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  estimatedTime: { type: Number, default: 5 },
  tags: [{ type: String }],
  requiredData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  templateConfig: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date }
}, { 
  timestamps: true,
  strict: false
});

// Indexes
questTemplateSchema.index({ isActive: 1, type: 1, category: 1 });
questTemplateSchema.index({ createdBy: 1 });
questTemplateSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('QuestTemplate', questTemplateSchema);