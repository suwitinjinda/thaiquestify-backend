/**
 * Test Script for Omise Payout API
 * 
 * Usage:
 *   node scripts/test-omise-payout.js
 * 
 * This script tests:
 * 1. Check Omise balance
 * 2. Create a test recipient
 * 3. Create a test transfer (payout)
 * 4. Check transfer status
 */

require('dotenv').config();
const omise = require('omise')({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: process.env.OMISE_API_VERSION || '2019-05-29'
});

async function testOmisePayout() {
  console.log('🧪 Testing Omise Payout API...\n');

  try {
    // Step 1: Check Balance
    console.log('1️⃣ Checking Omise balance...');
    const balance = await omise.balance.retrieve();
    const available = balance.available || 0;
    const total = balance.total || 0;
    console.log(`   ✅ Available: ${available > 0 ? (available / 100).toLocaleString() : '0'} THB`);
    console.log(`   ✅ Total: ${(total / 100).toLocaleString()} THB`);
    console.log(`   ✅ Mode: ${balance.livemode ? 'LIVE' : 'TEST'}\n`);

    if (available < 10000) { // Less than 100 THB
      console.warn('   ⚠️  Warning: Low balance! Add test balance in Omise dashboard.\n');
    }

    // Step 2: Create Test Recipient
    console.log('2️⃣ Creating test recipient...');
    const testRecipient = await omise.recipients.create({
      name: 'Test User',
      email: 'test@thaiquestify.com',
      type: 'individual',
      bank_account: {
        brand: 'bbl', // Bangkok Bank
        number: '1234567890',
        name: 'Test User'
      },
      description: 'Test recipient for payout API'
    });
    console.log(`   ✅ Recipient created: ${testRecipient.id}`);
    console.log(`   ✅ Status: ${testRecipient.verified ? 'Verified' : 'Pending verification'}`);
    console.log(`   ✅ Active: ${testRecipient.active ? 'Yes' : 'No'}\n`);

    // Wait a bit for verification (in test mode it's usually instant)
    if (!testRecipient.verified) {
      console.log('   ⏳ Waiting for recipient verification...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedRecipient = await omise.recipients.retrieve(testRecipient.id);
      console.log(`   ✅ Verification status: ${updatedRecipient.verified ? 'Verified' : 'Still pending'}\n`);
    }

    // Step 3: Create Test Transfer (Payout)
    if (balance.available < 10000) {
      console.log('   ⚠️  Skipping transfer test - insufficient balance\n');
      return;
    }

    console.log('3️⃣ Creating test transfer (payout)...');
    const testTransfer = await omise.transfers.create({
      amount: 10000, // 100 THB in satang
      recipient: testRecipient.id
    });
    console.log(`   ✅ Transfer created: ${testTransfer.id}`);
    console.log(`   ✅ Amount: ${(testTransfer.amount / 100).toLocaleString()} THB`);
    console.log(`   ✅ Status: ${testTransfer.status}`);
    console.log(`   ✅ Sendable: ${testTransfer.sendable ? 'Yes' : 'No'}\n`);

    // Step 4: Check Transfer Status
    console.log('4️⃣ Checking transfer status...');
    const transferStatus = await omise.transfers.retrieve(testTransfer.id);
    console.log(`   ✅ Transfer ID: ${transferStatus.id}`);
    console.log(`   ✅ Status: ${transferStatus.status || 'pending'}`);
    console.log(`   ✅ Amount: ${(transferStatus.amount / 100).toLocaleString()} THB`);
    if (transferStatus.fee) {
      console.log(`   ✅ Fee: ${(transferStatus.fee / 100).toLocaleString()} THB`);
    }
    if (transferStatus.net) {
      console.log(`   ✅ Net: ${(transferStatus.net / 100).toLocaleString()} THB`);
    }
    if (transferStatus.paid_at) {
      console.log(`   ✅ Paid at: ${new Date(transferStatus.paid_at * 1000).toLocaleString()}`);
    }
    console.log('');

    // Summary
    console.log('✅ Test completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   - Balance: ${available > 0 ? (available / 100).toLocaleString() : '0'} THB available`);
    console.log(`   - Recipient: ${testRecipient.id} (${testRecipient.verified ? 'Verified' : 'Pending'})`);
    console.log(`   - Transfer: ${testTransfer.id} (${transferStatus.status || 'pending'})`);
    console.log(`   - Mode: ${balance.livemode ? 'LIVE ⚠️' : 'TEST ✅'}`);
    
    if (!testRecipient.verified) {
      console.log(`\n⚠️  Note: Recipient is still pending verification.`);
      console.log(`   In test mode, you may need to verify manually in Omise dashboard.`);
      console.log(`   Or wait for automatic verification (can take time).`);
    }
    
    if (!testTransfer.sendable) {
      console.log(`\n⚠️  Note: Transfer is not sendable yet.`);
      console.log(`   This is because recipient is not verified.`);
      console.log(`   Once recipient is verified, transfer will become sendable.`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message.includes('insufficient')) {
      console.error('\n💡 Solution: Add test balance in Omise dashboard');
      console.error('   https://dashboard.omise.co/test/balance');
    }
    if (error.message.includes('verified')) {
      console.error('\n💡 Solution: Wait for recipient verification (usually instant in test mode)');
    }
    process.exit(1);
  }
}

// Run test
testOmisePayout();
