const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function migrateCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📦 Starting categories migration...');
    
    // Find all attractions
    const attractions = await TouristAttraction.find({});
    console.log(`Found ${attractions.length} attractions to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const attraction of attractions) {
      try {
        // If already has categories array, skip
        if (attraction.categories && Array.isArray(attraction.categories) && attraction.categories.length > 0) {
          console.log(`  ⏭️  Skipped (already has categories): ${attraction.name}`);
          skippedCount++;
          continue;
        }

        // Convert single category to categories array
        const category = attraction.category || 'other';
        const categories = [category];

        // Special cases: Add 'recommended' category for specific places
        // For ICONSIAM (bangkok-001), add 'recommended'
        if (attraction.id === 'bangkok-001') {
          if (!categories.includes('recommended')) {
            categories.push('recommended');
          }
          // Also update category to 'shopping' if it's not already
          if (!categories.includes('shopping')) {
            categories[0] = 'shopping'; // Replace first category
            if (!categories.includes('recommended')) {
              categories.push('recommended');
            }
          }
        }

        // Update attraction
        await TouristAttraction.updateOne(
          { _id: attraction._id },
          {
            $set: {
              categories: categories,
              // Keep category field for backward compatibility
              category: category
            }
          }
        );
        
        updatedCount++;
        console.log(`  ✅ Updated: ${attraction.name} -> categories: [${categories.join(', ')}]`);
      } catch (error) {
        console.error(`  ❌ Error processing ${attraction.name}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${attractions.length}`);

    // Verify ICONSIAM
    const iconsiam = await TouristAttraction.findOne({ id: 'bangkok-001' });
    if (iconsiam) {
      console.log('\n✅ ICONSIAM verification:');
      console.log(`   Categories: [${iconsiam.categories?.join(', ') || 'none'}]`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

migrateCategories();
