// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    // เปลี่ยนจาก required: true เป็น default: null
    default: null
  },
  userType: {
    type: String,
    enum: ['customer', 'partner', 'shop', 'admin'],
    required: true
  },
  partnerCode: {
    type: String,
    sparse: true
  },
  phone: String,
  photo: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  isMockUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);