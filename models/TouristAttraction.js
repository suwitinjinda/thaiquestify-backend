const mongoose = require('mongoose');

const touristAttractionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  nameEn: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  category: {
    type: String,
    required: false, // Keep for backward compatibility, but deprecated
    enum: ['historical', 'temple', 'museum', 'zoo', 'market', 'park', 'beach', 'mountain', 'waterfall', 'office', 'restaurant', 'michelin', 'other']
  },
  categories: {
    type: [String],
    required: true,
    default: ['other'],
    validate: {
      validator: function (categories) {
        const validCategories = ['historical', 'temple', 'museum', 'zoo', 'market', 'park', 'beach', 'mountain', 'waterfall', 'office', 'restaurant', 'michelin', 'shopping', 'recommended', 'other'];
        return categories.every(cat => validCategories.includes(cat));
      },
      message: 'All categories must be valid enum values'
    }
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
  checkInRadius: {
    type: Number,
    default: 100, // เมตร
    min: 10,
    max: 1000
  },
  thumbnail: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  coordinateSource: {
    type: String,
    default: 'manual',
    enum: ['manual', 'geocoding', 'admin', 'auto_update']
  },
  geocodedAddress: {
    type: String,
    default: null
  },
  // Auto-update coordinates from user check-ins
  checkInLocations: [{
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    distance: {
      type: Number // Distance from original coordinates in meters
    }
  }],
  autoUpdateEnabled: {
    type: Boolean,
    default: true // Enable auto-update by default
  },
  minCheckInsForUpdate: {
    type: Number,
    default: 5 // Minimum number of check-ins before updating coordinates
  },
  lastAutoUpdateAt: {
    type: Date,
    default: null
  },
  michelinRating: {
    type: String,
    default: null
  },
  michelinStars: {
    type: Number,
    default: null,
    min: 1,
    max: 3
  }
}, {
  timestamps: true, // createdAt, updatedAt
  collection: 'touristattractions'
});

// Indexes for better query performance
touristAttractionSchema.index({ province: 1, isActive: 1 });
touristAttractionSchema.index({ category: 1, isActive: 1 }); // Keep for backward compatibility
touristAttractionSchema.index({ categories: 1, isActive: 1 }); // Index for categories array
touristAttractionSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

module.exports = mongoose.model('TouristAttraction', touristAttractionSchema);
