// scripts/fixUserPoints.js
// Fix user points based on PointTransaction history

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const PointTransaction = require('../models/PointTransaction');
const User = require('../models/User');

/**
 * Fix user points based on PointTransaction history
 * Calculate: sum of all transactions for each user
 */
async function fixUserPoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({ points: { $exists: true } });
    console.log(`📋 Total users with points: ${users.length}\n`);

    let fixedCount = 0;
    let totalDiff = 0;

    for (const user of users) {
      // Get all transactions for this user
      const transactions = await PointTransaction.find({
        userId: user._id,
        status: 'completed'
      }).sort({ createdAt: 1 });

      // Calculate expected points from transactions
      // Start from 0, then add/subtract based on transactions
      let expectedPoints = 0;
      
      for (const txn of transactions) {
        // Negative amount = user paid (deduct from user)
        // Positive amount = user received (add to user)
        expectedPoints += txn.amount;
      }

      const actualPoints = user.points || 0;
      const diff = expectedPoints - actualPoints;

      if (Math.abs(diff) > 0.01) {
        console.log(`⚠️  User: ${user.name || user.email || user._id}`);
        console.log(`   Current points: ${actualPoints}`);
        console.log(`   Expected points: ${expectedPoints} (from ${transactions.length} transactions)`);
        console.log(`   Difference: ${diff}`);
        
        // Update user points
        user.points = expectedPoints;
        await user.save();
        
        console.log(`   ✅ Updated to: ${expectedPoints}`);
        console.log('');
        
        fixedCount++;
        totalDiff += Math.abs(diff);
      } else {
        console.log(`✅ User: ${user.name || user.email || user._id} - Points correct (${actualPoints})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed ${fixedCount} users`);
    console.log(`   Total difference corrected: ${totalDiff} points`);

    // Show transaction summary by type
    console.log('\n📋 Transaction Summary:');
    const summary = await PointTransaction.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    summary.forEach(s => {
      const sign = s.totalAmount >= 0 ? '+' : '';
      console.log(`   ${s._id}: ${s.count} transactions, total: ${sign}${s.totalAmount.toFixed(2)} (avg: ${s.avgAmount.toFixed(2)})`);
    });

    console.log('\n🎉 Fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user points:', error);
    process.exit(1);
  }
}

fixUserPoints();
