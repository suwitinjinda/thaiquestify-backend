// scripts/remove-chiangmai-michelin-selected-final.js
// Script to remove all "Chiang Mai Michelin Selected Final xx" entries from database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function removeChiangMaiMichelinSelectedFinal() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all entries with name matching "Chiang Mai Michelin Selected Final"
    const query = {
      name: { $regex: /^Chiang Mai Michelin Selected Final/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Michelin Selected'
    };

    const countBefore = await TouristAttraction.countDocuments(query);
    console.log(`📊 Found ${countBefore} entries matching "Chiang Mai Michelin Selected Final"`);

    if (countBefore === 0) {
      console.log('ℹ️  No entries to remove');
      await mongoose.disconnect();
      return;
    }

    // Show sample entries before deletion
    const sampleEntries = await TouristAttraction.find(query).limit(5);
    console.log('\n📋 Sample entries to be removed:');
    sampleEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.name} (ID: ${entry.id || entry._id})`);
    });

    // Delete all matching entries
    const result = await TouristAttraction.deleteMany(query);
    console.log(`\n✅ Successfully removed ${result.deletedCount} entries`);

    // Verify deletion
    const countAfter = await TouristAttraction.countDocuments(query);
    console.log(`📊 Remaining entries: ${countAfter}`);

    // Also check for entries with similar pattern in nameEn
    const queryEn = {
      nameEn: { $regex: /^Chiang Mai Michelin Selected Final/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Michelin Selected'
    };

    const countEnBefore = await TouristAttraction.countDocuments(queryEn);
    if (countEnBefore > 0) {
      console.log(`\n📊 Found ${countEnBefore} entries matching nameEn pattern`);
      const resultEn = await TouristAttraction.deleteMany(queryEn);
      console.log(`✅ Successfully removed ${resultEn.deletedCount} additional entries`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('✅ Script completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
removeChiangMaiMichelinSelectedFinal();
