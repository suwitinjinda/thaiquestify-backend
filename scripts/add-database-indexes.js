// scripts/add-database-indexes.js
// Run this script to add all recommended database indexes for performance

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const User = require('../models/User');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Delivery = require('../models/Delivery');
const Job = require('../models/Job');
const DeliveryRequest = require('../models/DeliveryRequest');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function addIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Adding database indexes...\n');

    // User indexes
    console.log('👤 Adding User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ phone: 1 }, { background: true });
    await User.collection.createIndex({ 'integrations.facebook.userId': 1 }, { background: true });
    await User.collection.createIndex({ 'integrations.google.userId': 1 }, { background: true });
    await User.collection.createIndex({ role: 1 }, { background: true });
    console.log('   ✅ User indexes added\n');

    // Order indexes
    console.log('📦 Adding Order indexes...');
    await Order.collection.createIndex({ user: 1, createdAt: -1 }, { background: true });
    await Order.collection.createIndex({ shop: 1, status: 1 }, { background: true });
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true, background: true });
    await Order.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    await Order.collection.createIndex({ orderType: 1, status: 1 }, { background: true });
    console.log('   ✅ Order indexes added\n');

    // Shop indexes
    console.log('🏪 Adding Shop indexes...');
    await Shop.collection.createIndex({ ownerEmail: 1 }, { background: true });
    await Shop.collection.createIndex({ 'location.coordinates': '2dsphere' }, { background: true });
    await Shop.collection.createIndex({ status: 1, approvedAt: 1 }, { background: true });
    await Shop.collection.createIndex({ province: 1, status: 1 }, { background: true });
    await Shop.collection.createIndex({ partnerId: 1 }, { background: true });
    console.log('   ✅ Shop indexes added\n');

    // Delivery indexes
    console.log('🚚 Adding Delivery indexes...');
    await Delivery.collection.createIndex({ rider: 1, status: 1 }, { background: true });
    await Delivery.collection.createIndex({ order: 1 }, { background: true });
    await Delivery.collection.createIndex({ 'location.coordinates': '2dsphere' }, { background: true });
    await Delivery.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    await Delivery.collection.createIndex({ shop: 1, status: 1 }, { background: true });
    console.log('   ✅ Delivery indexes added\n');

    // DeliveryRequest indexes
    console.log('📋 Adding DeliveryRequest indexes...');
    await DeliveryRequest.collection.createIndex({ order: 1 }, { background: true });
    await DeliveryRequest.collection.createIndex({ rider: 1, status: 1 }, { background: true });
    await DeliveryRequest.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    console.log('   ✅ DeliveryRequest indexes added\n');

    // Job indexes
    console.log('💼 Adding Job indexes...');
    // Note: Skipping 2dsphere index for Job because coordinates format is {latitude, longitude}
    // which doesn't match MongoDB's 2dsphere requirement of [longitude, latitude] array
    // Instead, we'll use regular indexes for location-based queries
    try {
      await Job.collection.createIndex({ employer: 1, status: 1 }, { background: true });
      await Job.collection.createIndex({ status: 1, startDate: 1 }, { background: true });
      await Job.collection.createIndex({ 'location.province': 1, status: 1 }, { background: true });
      await Job.collection.createIndex({ category: 1, status: 1 }, { background: true });
      await Job.collection.createIndex({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 }, { background: true });
      console.log('   ✅ Job indexes added (2dsphere skipped - coordinates format mismatch)\n');
    } catch (error) {
      console.log('   ⚠️ Some Job indexes may already exist or have issues:', error.message);
      console.log('   ✅ Continuing with other indexes...\n');
    }

    console.log('✅ All indexes added successfully!');
    console.log('\n📊 Index Summary:');
    console.log('   - User: 5 indexes');
    console.log('   - Order: 5 indexes');
    console.log('   - Shop: 5 indexes');
    console.log('   - Delivery: 5 indexes');
    console.log('   - DeliveryRequest: 3 indexes');
    console.log('   - Job: 5 indexes');
    console.log('\n💡 Note: Indexes are created in the background and may take a few minutes to complete.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
}

addIndexes();
