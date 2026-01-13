// scripts/remove-bangkok-generic-michelin.js
// Script to remove all "Bangkok Michelin Selected xx" and "Bangkok Bib Gourmand xx" entries from database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function removeBangkokGenericMichelin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all entries with name matching "Bangkok Michelin Selected" (but not "Final")
    const querySelected = {
      name: { $regex: /^Bangkok Michelin Selected \d+$/i },
      province: 'กรุงเทพมหานคร',
      michelinRating: 'Michelin Selected'
    };

    // Find all entries with name matching "Bangkok Bib Gourmand"
    const queryBib = {
      name: { $regex: /^Bangkok Bib Gourmand \d+$/i },
      province: 'กรุงเทพมหานคร',
      michelinRating: 'Bib Gourmand'
    };

    // Count entries
    const countSelected = await TouristAttraction.countDocuments(querySelected);
    const countBib = await TouristAttraction.countDocuments(queryBib);
    
    console.log(`📊 Found ${countSelected} entries matching "Bangkok Michelin Selected xx"`);
    console.log(`📊 Found ${countBib} entries matching "Bangkok Bib Gourmand xx"`);

    if (countSelected === 0 && countBib === 0) {
      console.log('ℹ️  No entries to remove');
      await mongoose.disconnect();
      return;
    }

    // Show sample entries before deletion
    if (countSelected > 0) {
      const sampleSelected = await TouristAttraction.find(querySelected).limit(5);
      console.log('\n📋 Sample "Bangkok Michelin Selected" entries to be removed:');
      sampleSelected.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.name} (ID: ${entry.id || entry._id})`);
      });
    }

    if (countBib > 0) {
      const sampleBib = await TouristAttraction.find(queryBib).limit(5);
      console.log('\n📋 Sample "Bangkok Bib Gourmand" entries to be removed:');
      sampleBib.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.name} (ID: ${entry.id || entry._id})`);
      });
    }

    // Delete all matching entries
    let totalDeleted = 0;

    if (countSelected > 0) {
      const resultSelected = await TouristAttraction.deleteMany(querySelected);
      console.log(`\n✅ Successfully removed ${resultSelected.deletedCount} "Bangkok Michelin Selected xx" entries`);
      totalDeleted += resultSelected.deletedCount;
    }

    if (countBib > 0) {
      const resultBib = await TouristAttraction.deleteMany(queryBib);
      console.log(`✅ Successfully removed ${resultBib.deletedCount} "Bangkok Bib Gourmand xx" entries`);
      totalDeleted += resultBib.deletedCount;
    }

    // Also check for entries with similar pattern in nameEn
    const querySelectedEn = {
      nameEn: { $regex: /^Bangkok Michelin Selected \d+$/i },
      province: 'กรุงเทพมหานคร',
      michelinRating: 'Michelin Selected'
    };

    const queryBibEn = {
      nameEn: { $regex: /^Bangkok Bib Gourmand \d+$/i },
      province: 'กรุงเทพมหานคร',
      michelinRating: 'Bib Gourmand'
    };

    const countSelectedEn = await TouristAttraction.countDocuments(querySelectedEn);
    const countBibEn = await TouristAttraction.countDocuments(queryBibEn);

    if (countSelectedEn > 0) {
      const resultSelectedEn = await TouristAttraction.deleteMany(querySelectedEn);
      console.log(`✅ Successfully removed ${resultSelectedEn.deletedCount} additional entries (nameEn pattern)`);
      totalDeleted += resultSelectedEn.deletedCount;
    }

    if (countBibEn > 0) {
      const resultBibEn = await TouristAttraction.deleteMany(queryBibEn);
      console.log(`✅ Successfully removed ${resultBibEn.deletedCount} additional entries (nameEn pattern)`);
      totalDeleted += resultBibEn.deletedCount;
    }

    // Verify deletion
    const countSelectedAfter = await TouristAttraction.countDocuments(querySelected);
    const countBibAfter = await TouristAttraction.countDocuments(queryBib);
    console.log(`\n📊 Remaining entries:`);
    console.log(`   - "Bangkok Michelin Selected xx": ${countSelectedAfter}`);
    console.log(`   - "Bangkok Bib Gourmand xx": ${countBibAfter}`);

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
removeBangkokGenericMichelin();
