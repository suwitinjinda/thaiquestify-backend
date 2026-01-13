// scripts/add-northern-provinces-attractions.js
// Migration script to add Northern Region tourist attractions to MongoDB

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');

// Import all province data
const chiangMai = require('../data/tourist-attractions/chiang-mai');
const chiangRai = require('../data/tourist-attractions/chiang-rai');
const lampang = require('../data/tourist-attractions/lampang');
const lamphun = require('../data/tourist-attractions/lamphun');
const nan = require('../data/tourist-attractions/nan');
const phayao = require('../data/tourist-attractions/phayao');
const phrae = require('../data/tourist-attractions/phrae');
const maeHongSon = require('../data/tourist-attractions/mae-hong-son');
const uttaradit = require('../data/tourist-attractions/uttaradit');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

// Province data mapping
const provinces = [
  { name: 'Chiang Mai', data: chiangMai.chiangMaiAttractions, provinceName: 'เชียงใหม่' },
  { name: 'Chiang Rai', data: chiangRai.chiangRaiAttractions, provinceName: 'เชียงราย' },
  { name: 'Lampang', data: lampang.lampangAttractions, provinceName: 'ลำปาง' },
  { name: 'Lamphun', data: lamphun.lamphunAttractions, provinceName: 'ลำพูน' },
  { name: 'Nan', data: nan.nanAttractions, provinceName: 'น่าน' },
  { name: 'Phayao', data: phayao.phayaoAttractions, provinceName: 'พะเยา' },
  { name: 'Phrae', data: phrae.phraeAttractions, provinceName: 'แพร่' },
  { name: 'Mae Hong Son', data: maeHongSon.maeHongSonAttractions, provinceName: 'แม่ฮ่องสอน' },
  { name: 'Uttaradit', data: uttaradit.uttaraditAttractions, provinceName: 'อุตรดิตถ์' }
];

async function migrateNorthernProvincesAttractions() {
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
            await TouristAttraction.findOneAndUpdate(
              { id: attraction.id },
              {
                $set: {
                  name: attraction.name,
                  nameEn: attraction.nameEn,
                  description: attraction.description,
                  coordinates: attraction.coordinates,
                  category: attraction.category,
                  categories: attraction.categories,
                  province: attraction.province,
                  district: attraction.district,
                  address: attraction.address,
                  checkInRadius: attraction.checkInRadius,
                  thumbnail: attraction.thumbnail,
                  isActive: attraction.isActive,
                  updatedAt: new Date()
                }
              }
            );
            updated++;
            totalUpdated++;
          } else {
            // Create new attraction
            await TouristAttraction.create(attraction);
            added++;
            totalAdded++;
          }
        } catch (error) {
          console.error(`❌ Error processing ${attraction.id}:`, error.message);
          skipped++;
          totalSkipped++;
        }
      }
      
      console.log(`✅ ${province.provinceName}: ${added} added, ${updated} updated, ${skipped} skipped\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Total added: ${totalAdded}`);
    console.log(`   🔄 Total updated: ${totalUpdated}`);
    console.log(`   ⚠️  Total skipped: ${totalSkipped}`);
    console.log(`   📈 Total processed: ${totalAdded + totalUpdated + totalSkipped}\n`);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run migration
migrateNorthernProvincesAttractions();
