// scripts/add-pathum-thani-attractions.js
// Migration script to add Pathum Thani tourist attractions to MongoDB

const mongoose = require('mongoose');
const pathumThaniData = require('../data/tourist-attractions/pathum-thani');
const TouristAttraction = require('../models/TouristAttraction');

// Handle both array export and object export
const pathumThaniAttractions = pathumThaniData.pathumThaniAttractions || [];

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function migratePathumThaniAttractions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log(`\n📦 Processing ${pathumThaniAttractions.length} Pathum Thani attractions...\n`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const attraction of pathumThaniAttractions) {
      try {
        // Check if attraction already exists
        const existing = await TouristAttraction.findOne({ id: attraction.id });

        if (existing) {
          // Update existing attraction
          const updateData = {
            name: attraction.name,
            nameEn: attraction.nameEn || '',
            description: attraction.description || '',
            coordinates: attraction.coordinates,
            category: attraction.category,
            province: attraction.province,
            district: attraction.district || '',
            address: attraction.address || '',
            checkInRadius: attraction.checkInRadius || 100,
            thumbnail: attraction.thumbnail || null,
            isActive: attraction.isActive !== undefined ? attraction.isActive : true,
          };

          // Add categories if provided
          if (attraction.categories && Array.isArray(attraction.categories)) {
            updateData.categories = attraction.categories;
          } else if (attraction.category) {
            // Convert single category to categories array
            updateData.categories = [attraction.category];
          }

          await TouristAttraction.updateOne(
            { id: attraction.id },
            { $set: updateData }
          );
          console.log(`  ✅ Updated: ${attraction.name}`);
          updated++;
        } else {
          // Create new attraction
          const createData = {
            ...attraction,
            coordinateSource: 'manual',
            michelinRating: attraction.michelinRating || null,
            michelinStars: attraction.michelinStars || null
          };

          // Ensure categories array exists
          if (!createData.categories || !Array.isArray(createData.categories)) {
            createData.categories = createData.category ? [createData.category] : ['other'];
          }

          await TouristAttraction.create(createData);
          console.log(`  ➕ Added: ${attraction.name}`);
          added++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${attraction.name}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ➕ Added: ${added}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${pathumThaniAttractions.length}`);

    // Verify results
    const totalInDB = await TouristAttraction.countDocuments({ province: 'ปทุมธานี' });
    console.log(`\n✅ Total Pathum Thani attractions in database: ${totalInDB}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run migration
if (require.main === module) {
  migratePathumThaniAttractions()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migratePathumThaniAttractions;
