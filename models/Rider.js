// backend/models/Rider.js
const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  idCardNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[0-9]{13}$/
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{9,10}$/
  },

  // Location Information
  address: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  province: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },

  // Documents
  idCardImage: {
    type: String, // URL to image
    required: true
  },
  driverLicenseImage: {
    type: String, // URL to image
    required: true
  },

  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'suspended'],
    default: 'pending'
  },

  // Admin Approval Process (only admin can approve)
  adminApproval: {
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    suspensionReason: {
      type: String,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },

  // Unique Rider Code (generated after admin approval)
  riderCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },

  // Service Availability
  isAvailable: {
    type: Boolean,
    default: false // Rider must manually turn on availability
  },
  serviceRadius: {
    type: Number,
    default: 5, // Default 5 km radius
    min: 1,
    max: 50
  },
  lastLocationUpdate: {
    type: Date,
    default: null
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
riderSchema.index({ user: 1 });
riderSchema.index({ status: 1 });
riderSchema.index({ riderCode: 1 });

// Generate unique rider code
riderSchema.methods.generateRiderCode = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.riderCode = `RID${timestamp}${random}`;
  return this.riderCode;
};

module.exports = mongoose.model('Rider', riderSchema);
