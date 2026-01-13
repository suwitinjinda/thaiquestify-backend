// scripts/migrate-tourist-attractions.js
// Migration script to import tourist attractions from file to database

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
const touristAttractionsData = require('../data/tourist-attractions/samut-prakan');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function migrateTouristAttractions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all attractions from file
    const allAttractions = touristAttractionsData.getAllActiveAttractions();
    console.log(`📦 Found ${allAttractions.length} attractions in file`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const attraction of allAttractions) {
      try {
        // Check if attraction already exists
        const existing = await TouristAttraction.findOne({ id: attraction.id });

        if (existing) {
          // Update existing
          await TouristAttraction.updateOne(
            { id: attraction.id },
            {
              $set: {
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
              }
            }
          );
          updated++;
          console.log(`✅ Updated: ${attraction.name}`);
        } else {
          // Create new
          await TouristAttraction.create({
            id: attraction.id,
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
            coordinateSource: 'manual'
          });
          imported++;
          console.log(`➕ Imported: ${attraction.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${attraction.name}:`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${allAttractions.length}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateTouristAttractions();
