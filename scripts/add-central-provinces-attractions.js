// scripts/add-central-provinces-attractions.js
// Migration script to add Central Region tourist attractions to MongoDB

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');

// Import all province data
const nonthaburi = require('../data/tourist-attractions/nonthaburi');
const ayutthaya = require('../data/tourist-attractions/ayutthaya');
const lopburi = require('../data/tourist-attractions/lopburi');
const saraburi = require('../data/tourist-attractions/saraburi');
const angThong = require('../data/tourist-attractions/ang-thong');
const singburi = require('../data/tourist-attractions/singburi');
const chainat = require('../data/tourist-attractions/chainat');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

// Province data mapping
const provinces = [
  { name: 'Nonthaburi', data: nonthaburi.nonthaburiAttractions, provinceName: 'นนทบุรี' },
  { name: 'Ayutthaya', data: ayutthaya.ayutthayaAttractions, provinceName: 'พระนครศรีอยุธยา' },
  { name: 'Lopburi', data: lopburi.lopburiAttractions, provinceName: 'ลพบุรี' },
  { name: 'Saraburi', data: saraburi.saraburiAttractions, provinceName: 'สระบุรี' },
  { name: 'Ang Thong', data: angThong.angThongAttractions, provinceName: 'อ่างทอง' },
  { name: 'Singburi', data: singburi.singburiAttractions, provinceName: 'สิงห์บุรี' },
  { name: 'Chainat', data: chainat.chainatAttractions, provinceName: 'ชัยนาท' }
];

async function migrateCentralProvincesAttractions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const province of provinces) {
      console.log(`📦 Processing ${province.provinceName} (${province.data.length} attractions)...\n`);
      
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const attraction of province.data) {
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

      console.log(`\n📊 ${province.provinceName} Summary:`);
      console.log(`   ➕ Added: ${added}`);
      console.log(`   ✅ Updated: ${updated}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
      console.log(`   📝 Total: ${province.data.length}\n`);

      totalAdded += added;
      totalUpdated += updated;
      totalSkipped += skipped;

      // Verify results
      const totalInDB = await TouristAttraction.countDocuments({ province: province.provinceName });
      console.log(`✅ Total ${province.provinceName} attractions in database: ${totalInDB}\n`);
    }

    console.log(`\n📊 Overall Migration Summary:`);
    console.log(`   ➕ Total Added: ${totalAdded}`);
    console.log(`   ✅ Total Updated: ${totalUpdated}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   📝 Total Processed: ${totalAdded + totalUpdated + totalSkipped}`);

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
  migrateCentralProvincesAttractions()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateCentralProvincesAttractions;
