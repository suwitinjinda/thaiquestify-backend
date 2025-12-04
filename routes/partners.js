// backend/routes/partner.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const partnerController = require('../controllers/partnerController');

// Apply auth middleware to all routes
router.use(auth);

// Shop registration routes
router.post('/shops/register', partnerController.registerShop);
router.get('/shops', partnerController.getPartnerShops);
router.get('/shops/:shopId', partnerController.getShopDetails);
router.post('/shops/generate-number', partnerController.generateShopNumber);

// Partner dashboard statistics
router.get('/dashboard', partnerController.getPartnerDashboard);

module.exports = router;