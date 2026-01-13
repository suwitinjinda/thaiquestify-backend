const mongoose = require('mongoose');

/**
 * PointSystem Model
 * Manages the overall point system pool for the application
 * - Total points available for distribution
 * - Tracks used and available points
 * - Default values for new users and tourist quests
 */
const pointSystemSchema = new mongoose.Schema({
  // Total points in the system
  totalPoints: {
    type: Number,
    required: true,
    default: 100000,
    min: 0
  },
  
  // Points that have been claimed/used
  usedPoints: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Available points (calculated: totalPoints - usedPoints)
  availablePoints: {
    type: Number,
    required: true,
    default: 100000,
    min: 0
  },
  
  // Default points for new user registration
  newUserPoints: {
    type: Number,
    required: true,
    default: 100000,
    min: 0
  },
  
  // Default points for tourist quest rewards
  touristQuestPoints: {
    type: Number,
    required: true,
    default: 100000,
    min: 0
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for calculating available points
pointSystemSchema.virtual('calculatedAvailablePoints').get(function() {
  return Math.max(0, this.totalPoints - this.usedPoints);
});

// Pre-save hook to update availablePoints
pointSystemSchema.pre('save', function(next) {
  this.availablePoints = Math.max(0, this.totalPoints - this.usedPoints);
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create singleton instance
pointSystemSchema.statics.getSystem = async function() {
  let system = await this.findOne();
  if (!system) {
    system = await this.create({
      totalPoints: 100000,
      usedPoints: 0,
      availablePoints: 100000,
      newUserPoints: 100000,
      touristQuestPoints: 100000
    });
  }
  return system;
};

// Method to add points (increase total)
pointSystemSchema.methods.addPoints = async function(amount, userId) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  this.totalPoints += amount;
  this.availablePoints = Math.max(0, this.totalPoints - this.usedPoints);
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Method to use points (decrease available)
pointSystemSchema.methods.usePoints = async function(amount, userId) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (this.availablePoints < amount) {
    throw new Error('Insufficient points available');
  }
  this.usedPoints += amount;
  this.availablePoints = Math.max(0, this.totalPoints - this.usedPoints);
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Method to refund points (decrease used, increase available)
pointSystemSchema.methods.refundPoints = async function(amount, userId) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (this.usedPoints < amount) {
    throw new Error('Cannot refund more than used points');
  }
  this.usedPoints = Math.max(0, this.usedPoints - amount);
  this.availablePoints = Math.max(0, this.totalPoints - this.usedPoints);
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Method to update default values
pointSystemSchema.methods.updateDefaults = async function(newUserPoints, touristQuestPoints, userId) {
  if (newUserPoints !== undefined) {
    this.newUserPoints = newUserPoints;
  }
  if (touristQuestPoints !== undefined) {
    this.touristQuestPoints = touristQuestPoints;
  }
  this.updatedBy = userId;
  await this.save();
  return this;
};

const PointSystem = mongoose.model('PointSystem', pointSystemSchema);

module.exports = PointSystem;
