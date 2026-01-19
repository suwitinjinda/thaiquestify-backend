// scripts/fixPointTransactions.js
// Fix PointTransactions and PointSystem to ensure consistency

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const PointTransaction = require('../models/PointTransaction');
const PointSystem = require('../models/PointSystem');
const User = require('../models/User');

/**
 * Fix PointTransactions:
 * 1. Fee transactions (job_application_fee, job_commission_fee) should be negative and add to PointSystem
 * 2. Reward transactions should be positive and deduct from PointSystem
 */
async function fixPointTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const pointSystem = await PointSystem.getSystem();
    console.log(`📊 Current PointSystem: totalPoints=${pointSystem.totalPoints}, usedPoints=${pointSystem.usedPoints}, availablePoints=${pointSystem.availablePoints}`);

    // Get all transactions
    const allTransactions = await PointTransaction.find({}).sort({ createdAt: 1 });
    console.log(`\n📋 Total transactions: ${allTransactions.length}`);

    let fixedCount = 0;
    let systemPointsDelta = 0; // Track changes to system points

    // Process each transaction
    for (const transaction of allTransactions) {
      let needsFix = false;
      let newAmount = transaction.amount;

      // Fix fee transactions: should be negative (user pays)
      if (transaction.type === 'job_application_fee' || transaction.type === 'job_commission_fee') {
        if (transaction.amount > 0) {
          // Should be negative (user pays)
          newAmount = -Math.abs(transaction.amount);
          needsFix = true;
          console.log(`⚠️  Fixing ${transaction.type}: ${transaction.amount} -> ${newAmount}`);
        }
      }

      // Fix reward transactions: should be positive (user receives)
      if (transaction.type === 'reward') {
        if (transaction.amount < 0) {
          // Should be positive (user receives)
          newAmount = Math.abs(transaction.amount);
          needsFix = true;
          console.log(`⚠️  Fixing ${transaction.type}: ${transaction.amount} -> ${newAmount}`);
        }
      }

      if (needsFix) {
        transaction.amount = newAmount;
        await transaction.save();
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} transactions`);

    // Recalculate PointSystem based on transaction history
    console.log('\n🔄 Recalculating PointSystem...');

    // Sum all rewards (platform pays - should deduct from system)
    const totalRewards = await PointTransaction.aggregate([
      { $match: { type: 'reward', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRewardsAmount = Math.abs(totalRewards[0]?.total || 0);

    // Sum all fees (platform receives - should add to system)
    const totalFees = await PointTransaction.aggregate([
      { $match: { type: { $in: ['job_application_fee', 'job_commission_fee'] }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
    ]);
    const totalFeesAmount = totalFees[0]?.total || 0;

    console.log(`   Total rewards paid: ${totalRewardsAmount} points`);
    console.log(`   Total fees received: ${totalFeesAmount} points`);

    // Calculate expected system state
    // Initial system points (assume 100000)
    const initialPoints = 100000;
    // System should have: initial - rewards paid + fees received
    const expectedTotalPoints = initialPoints - totalRewardsAmount + totalFeesAmount;
    const expectedUsedPoints = totalRewardsAmount; // Rewards used from system
    const expectedAvailablePoints = expectedTotalPoints - expectedUsedPoints;

    console.log(`\n📊 Expected PointSystem state:`);
    console.log(`   totalPoints: ${expectedTotalPoints}`);
    console.log(`   usedPoints: ${expectedUsedPoints}`);
    console.log(`   availablePoints: ${expectedAvailablePoints}`);

    console.log(`\n📊 Current PointSystem state:`);
    console.log(`   totalPoints: ${pointSystem.totalPoints}`);
    console.log(`   usedPoints: ${pointSystem.usedPoints}`);
    console.log(`   availablePoints: ${pointSystem.availablePoints}`);

    // Update PointSystem if needed
    const needsUpdate = 
      pointSystem.totalPoints !== expectedTotalPoints ||
      pointSystem.usedPoints !== expectedUsedPoints ||
      pointSystem.availablePoints !== expectedAvailablePoints;

    if (needsUpdate) {
      console.log('\n⚠️  PointSystem needs update!');
      pointSystem.totalPoints = expectedTotalPoints;
      pointSystem.usedPoints = expectedUsedPoints;
      pointSystem.availablePoints = expectedAvailablePoints;
      await pointSystem.save();
      console.log('✅ PointSystem updated');
    } else {
      console.log('\n✅ PointSystem is already correct');
    }

    // Verify user points
    console.log('\n🔍 Verifying user points...');
    const users = await User.find({ points: { $exists: true } });
    console.log(`   Total users with points: ${users.length}`);

    let userMismatches = 0;
    for (const user of users) {
      // Calculate expected points from transactions
      const userTransactions = await PointTransaction.find({ 
        userId: user._id,
        status: 'completed'
      });

      const calculatedPoints = userTransactions.reduce((sum, t) => {
        // Negative amount = user paid (deduct)
        // Positive amount = user received (add)
        return sum + t.amount;
      }, 0);

      // User should start with 0 points (or check new_user points)
      const expectedPoints = calculatedPoints;
      const actualPoints = user.points || 0;

      if (Math.abs(expectedPoints - actualPoints) > 0.01) {
        console.log(`⚠️  User ${user._id} (${user.name || user.email}): expected=${expectedPoints}, actual=${actualPoints}, diff=${expectedPoints - actualPoints}`);
        userMismatches++;
      }
    }

    if (userMismatches === 0) {
      console.log('✅ All user points are consistent with transactions');
    } else {
      console.log(`\n⚠️  Found ${userMismatches} users with mismatched points`);
      console.log('   Note: Users may have received initial points on registration');
    }

    console.log('\n🎉 Fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing point transactions:', error);
    process.exit(1);
  }
}

fixPointTransactions();
