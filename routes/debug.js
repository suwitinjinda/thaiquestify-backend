// backend/routes/debug.js
const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const Shop = require('../models/Shop');

// Debug route to see all quests
router.get('/quests', async (req, res) => {
  try {
    const quests = await Quest.find()
      .populate('template')
      .populate('shop')
      .sort({ createdAt: -1 });
    
    res.json({
      totalQuests: quests.length,
      quests: quests.map(q => ({
        id: q._id,
        name: q.name,
        budget: q.budget,
        status: q.status,
        shop: q.shop?.shopName,
        template: q.template?.name,
        createdAt: q.createdAt,
        qrCode: q.qrCode
      }))
    });
  } catch (error) {
    console.error('Debug quests error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Debug route to see all shops
router.get('/shops', async (req, res) => {
  try {
    const shops = await Shop.find().populate('user');
    
    res.json({
      totalShops: shops.length,
      shops: shops.map(s => ({
        id: s._id,
        shopName: s.shopName,
        balance: s.balance,
        reservedBalance: s.reservedBalance,
        user: s.user?.email,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug shops error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;