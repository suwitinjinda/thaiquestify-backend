const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  places: [{
    // Store tourist attraction data (can be reference or embedded)
    id: { type: String },
    name: { type: String, required: true },
    nameEn: { type: String, default: '' },
    description: { type: String, default: '' },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    category: { type: String },
    categories: { type: [String], default: ['other'] },
    province: { type: String },
    district: { type: String },
    address: { type: String },
    // Store full attraction data for offline access
    attractionData: { type: mongoose.Schema.Types.Mixed }
  }],
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

// Index for faster queries
tripSchema.index({ userId: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
