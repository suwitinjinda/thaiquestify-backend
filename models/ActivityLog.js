const mongoose = require('mongoose');

/**
 * ActivityLog Model
 * Tracks all user activities and system events for auditing and analytics
 */
const activityLogSchema = new mongoose.Schema({
  // Action type (e.g., 'user_login', 'job_created', 'payment_made')
  action: {
    type: String,
    required: true,
    index: true
  },
  
  // Category of activity
  category: {
    type: String,
    enum: ['auth', 'job', 'quest', 'payment', 'shop', 'admin', 'system', 'api', 'security', 'user'],
    index: true
  },
  
  // User who performed the action (if applicable)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Related entity IDs (for relationships)
  relatedEntities: {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' }
  },
  
  // Feature / API endpoint
  endpoint: {
    type: String,
    index: true
  },
  
  // Object ID affected (e.g., jobId, userId, shopId)
  objectId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // Before value (for updates)
  beforeValue: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // After value (for updates)
  afterValue: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Request / Trace ID for tracking
  traceId: {
    type: String,
    index: true
  },
  
  // User role at the time of action
  userRole: {
    type: String
  },
  
  // Additional metadata (flexible JSON structure)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // IP address
  ipAddress: {
    type: String,
    index: true
  },
  
  // User agent
  userAgent: {
    type: String
  },
  
  // Status of the action (success / fail)
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'cancelled'],
    default: 'success',
    index: true
  },
  
  // Error information (if action failed)
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  // Duration in milliseconds (for performance tracking)
  duration: {
    type: Number
  },
  
  // UTC timestamp (stored separately for audit compliance)
  timestampUTC: {
    type: Date,
    default: () => new Date(),
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ timestampUTC: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ endpoint: 1, createdAt: -1 });
activityLogSchema.index({ traceId: 1 });
activityLogSchema.index({ objectId: 1, createdAt: -1 });
activityLogSchema.index({ 'relatedEntities.jobId': 1, createdAt: -1 });
activityLogSchema.index({ 'relatedEntities.questId': 1, createdAt: -1 });

// Static method to get activity statistics
activityLogSchema.statics.getStats = async function(filters = {}) {
  const match = {};
  if (filters.userId) match.userId = filters.userId;
  if (filters.action) match.action = filters.action;
  if (filters.category) match.category = filters.category;
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgDuration: { $avg: '$duration' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return stats;
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
