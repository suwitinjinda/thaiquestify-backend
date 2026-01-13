// backend/utils/shopIdGenerator.js
const Shop = require('../models/Shop');

/**
 * Generate a unique 6-digit shop ID
 * Format: 6 digits (e.g., 123456)
 * Ensures no duplicates in database
 */
async function generateUniqueShopId() {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate random 6-digit number (100000-999999)
    const shopId = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if shopId already exists
    const existingShop = await Shop.findOne({ shopId });

    if (!existingShop) {
      console.log(`✅ Generated unique shop ID: ${shopId} (attempt ${attempts + 1})`);
      return shopId;
    }

    attempts++;
    console.log(`⚠️ Shop ID ${shopId} already exists, trying again... (attempt ${attempts})`);
  }

  throw new Error('Failed to generate unique shop ID after maximum attempts');
}

module.exports = {
  generateUniqueShopId
};
