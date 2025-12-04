// server/routes/redemptions.js
const express = require('express');
const Redemption = require('../models/Redemption');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's redemptions
router.get('/my-redemptions', authMiddleware, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ user: req.user._id })
      .populate('quest', 'title reward points')
      .populate('partner', 'shopName category')
      .sort({ redeemedAt: -1 });

    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;