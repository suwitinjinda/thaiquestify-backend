const mongoose = require('mongoose');

// FoodMenuItem - เมนูอาหารของร้านค้า
const foodMenuItemSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String, // GCP URL หรือ URL ภายนอก
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

foodMenuItemSchema.index({ shop: 1, isDeleted: 1, isAvailable: 1 });

module.exports = mongoose.model('FoodMenuItem', foodMenuItemSchema);

