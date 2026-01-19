// scripts/remove-chiangmai-generic-michelin.js
// Script to remove all "Chiang Mai Bib Gourmand xx" and "Chiang Mai Michelin Selected xx" entries from database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function removeChiangMaiGenericMichelin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all entries with name matching "Chiang Mai Bib Gourmand"
    const queryBib = {
      name: { $regex: /^Chiang Mai Bib Gourmand \d+$/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Bib Gourmand'
    };

    // Find all entries with name matching "Chiang Mai Michelin Selected"
    const querySelected = {
      name: { $regex: /^Chiang Mai Michelin Selected \d+$/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Michelin Selected'
    };

    // Count entries
    const countBib = await TouristAttraction.countDocuments(queryBib);
    const countSelected = await TouristAttraction.countDocuments(querySelected);

    console.log(`📊 Found ${countBib} entries matching "Chiang Mai Bib Gourmand xx"`);
    console.log(`📊 Found ${countSelected} entries matching "Chiang Mai Michelin Selected xx"`);

    if (countBib === 0 && countSelected === 0) {
      console.log('ℹ️  No entries to remove');
      await mongoose.disconnect();
      return;
    }

    // Show sample entries before deletion
    if (countBib > 0) {
      const sampleBib = await TouristAttraction.find(queryBib).limit(5);
      console.log('\n📋 Sample "Chiang Mai Bib Gourmand" entries to be removed:');
      sampleBib.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.name} (ID: ${entry.id || entry._id})`);
      });
    }

    if (countSelected > 0) {
      const sampleSelected = await TouristAttraction.find(querySelected).limit(5);
      console.log('\n📋 Sample "Chiang Mai Michelin Selected" entries to be removed:');
      sampleSelected.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.name} (ID: ${entry.id || entry._id})`);
      });
    }

    // Delete all matching entries
    let totalDeleted = 0;

    if (countBib > 0) {
      const resultBib = await TouristAttraction.deleteMany(queryBib);
      console.log(`\n✅ Successfully removed ${resultBib.deletedCount} "Chiang Mai Bib Gourmand xx" entries`);
      totalDeleted += resultBib.deletedCount;
    }

    if (countSelected > 0) {
      const resultSelected = await TouristAttraction.deleteMany(querySelected);
      console.log(`✅ Successfully removed ${resultSelected.deletedCount} "Chiang Mai Michelin Selected xx" entries`);
      totalDeleted += resultSelected.deletedCount;
    }

    // Also check for entries with similar pattern in nameEn
    const queryBibEn = {
      nameEn: { $regex: /^Chiang Mai Bib Gourmand \d+$/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Bib Gourmand'
    };

    const querySelectedEn = {
      nameEn: { $regex: /^Chiang Mai Michelin Selected \d+$/i },
      province: { $regex: /เชียงใหม่/i },
      michelinRating: 'Michelin Selected'
    };

    const countBibEn = await TouristAttraction.countDocuments(queryBibEn);
    const countSelectedEn = await TouristAttraction.countDocuments(querySelectedEn);

    if (countBibEn > 0) {
      const resultBibEn = await TouristAttraction.deleteMany(queryBibEn);
      console.log(`✅ Successfully removed ${resultBibEn.deletedCount} additional entries (nameEn pattern - Bib Gourmand)`);
      totalDeleted += resultBibEn.deletedCount;
    }

    if (countSelectedEn > 0) {
      const resultSelectedEn = await TouristAttraction.deleteMany(querySelectedEn);
      console.log(`✅ Successfully removed ${resultSelectedEn.deletedCount} additional entries (nameEn pattern - Michelin Selected)`);
      totalDeleted += resultSelectedEn.deletedCount;
    }

    // Verify deletion
    const countBibAfter = await TouristAttraction.countDocuments(queryBib);
    const countSelectedAfter = await TouristAttraction.countDocuments(querySelected);
    console.log(`\n📊 Remaining entries:`);
    console.log(`   - "Chiang Mai Bib Gourmand xx": ${countBibAfter}`);
    console.log(`   - "Chiang Mai Michelin Selected xx": ${countSelectedAfter}`);

    console.log(`\n✅ Total deleted: ${totalDeleted} entries`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('✅ Script completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
removeChiangMaiGenericMichelin();
