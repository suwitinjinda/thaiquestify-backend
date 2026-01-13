const express = require('express');
const router = express.Router();
const TouristAttraction = require('../models/TouristAttraction');

/**
 * GET /api/tourist-attractions
 * Get all tourist attractions (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { province, category, search } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (province) {
      query.province = province;
    }
    
    if (category) {
      // Support both old single category and new categories array
      // MongoDB automatically matches array fields if any element matches
      // So { categories: category } will match if category is in the array
      query.$or = [
        { category: category }, // Backward compatibility with old category field
        { categories: category } // New categories array field
      ];
    }
    
    if (search) {
      // Normalize search term for province matching
      const searchLower = search.toLowerCase().trim();
      const provinceMatch = {
        'กรุงเทพ': 'กรุงเทพมหานคร',
        'กรุงเทพฯ': 'กรุงเทพมหานคร',
        'กรุงเทพมหานคร': 'กรุงเทพมหานคร',
        'bangkok': 'กรุงเทพมหานคร',
        'สมุทรปราการ': 'สมุทรปราการ',
        'samut prakan': 'สมุทรปราการ',
        'samutprakan': 'สมุทรปราการ',
        'ปทุมธานี': 'ปทุมธานี',
        'pathum thani': 'ปทุมธานี',
        'pathumthani': 'ปทุมธานี',
        'pathum-thani': 'ปทุมธานี',
        'นนทบุรี': 'นนทบุรี',
        'nonthaburi': 'นนทบุรี',
        'พระนครศรีอยุธยา': 'พระนครศรีอยุธยา',
        'อยุธยา': 'พระนครศรีอยุธยา',
        'ayutthaya': 'พระนครศรีอยุธยา',
        'ลพบุรี': 'ลพบุรี',
        'lopburi': 'ลพบุรี',
        'สระบุรี': 'สระบุรี',
        'saraburi': 'สระบุรี',
        'อ่างทอง': 'อ่างทอง',
        'ang-thong': 'อ่างทอง',
        'angthong': 'อ่างทอง',
        'สิงห์บุรี': 'สิงห์บุรี',
        'singburi': 'สิงห์บุรี',
        'ชัยนาท': 'ชัยนาท',
        'chainat': 'ชัยนาท',
        // Northern provinces
        'เชียงใหม่': 'เชียงใหม่',
        'chiang mai': 'เชียงใหม่',
        'chiangmai': 'เชียงใหม่',
        'chiang-mai': 'เชียงใหม่',
        'เชียงราย': 'เชียงราย',
        'chiang rai': 'เชียงราย',
        'chiangrai': 'เชียงราย',
        'chiang-rai': 'เชียงราย',
        'ลำปาง': 'ลำปาง',
        'lampang': 'ลำปาง',
        'ลำพูน': 'ลำพูน',
        'lamphun': 'ลำพูน',
        'น่าน': 'น่าน',
        'nan': 'น่าน',
        'พะเยา': 'พะเยา',
        'phayao': 'พะเยา',
        'แพร่': 'แพร่',
        'phrae': 'แพร่',
        'แม่ฮ่องสอน': 'แม่ฮ่องสอน',
        'mae hong son': 'แม่ฮ่องสอน',
        'maehongson': 'แม่ฮ่องสอน',
        'mae-hong-son': 'แม่ฮ่องสอน',
        'อุตรดิตถ์': 'อุตรดิตถ์',
        'uttaradit': 'อุตรดิตถ์',
        // Additional Northern provinces
        'ตาก': 'ตาก',
        'tak': 'ตาก',
        'สุโขทัย': 'สุโขทัย',
        'sukhothai': 'สุโขทัย',
        'พิษณุโลก': 'พิษณุโลก',
        'phitsanulok': 'พิษณุโลก',
        'พิจิตร': 'พิจิตร',
        'pichit': 'พิจิตร',
        'กำแพงเพชร': 'กำแพงเพชร',
        'kamphaeng-phet': 'กำแพงเพชร',
        'kamphaengphet': 'กำแพงเพชร',
        'นครสวรรค์': 'นครสวรรค์',
        'nakhon-sawan': 'นครสวรรค์',
        'nakhonsawan': 'นครสวรรค์',
        'อุทัยธานี': 'อุทัยธานี',
        'uthai-thani': 'อุทัยธานี',
        'uthaithani': 'อุทัยธานี',
        // Additional Central provinces
        'นครนายก': 'นครนายก',
        'nakhon-nayok': 'นครนายก',
        'nakhonnayok': 'นครนายก',
        'ปราจีนบุรี': 'ปราจีนบุรี',
        'prachin-buri': 'ปราจีนบุรี',
        'prachinburi': 'ปราจีนบุรี',
        'สระแก้ว': 'สระแก้ว',
        'sa-kaeo': 'สระแก้ว',
        'sakaeo': 'สระแก้ว',
        'ฉะเชิงเทรา': 'ฉะเชิงเทรา',
        'chachoengsao': 'ฉะเชิงเทรา',
        'สมุทรสาคร': 'สมุทรสาคร',
        'samut-sakhon': 'สมุทรสาคร',
        'samutsakhon': 'สมุทรสาคร',
        'สมุทรสงคราม': 'สมุทรสงคราม',
        'samut-songkhram': 'สมุทรสงคราม',
        'samutsongkhram': 'สมุทรสงคราม',
        'นครปฐม': 'นครปฐม',
        'nakhon-pathom': 'นครปฐม',
        'nakhonpathom': 'นครปฐม',
        'สุพรรณบุรี': 'สุพรรณบุรี',
        'suphan-buri': 'สุพรรณบุรี',
        'suphanburi': 'สุพรรณบุรี',
        // Eastern provinces
        'ชลบุรี': 'ชลบุรี',
        'chonburi': 'ชลบุรี',
        'ระยอง': 'ระยอง',
        'rayong': 'ระยอง',
        'จันทบุรี': 'จันทบุรี',
        'chanthaburi': 'จันทบุรี',
        'ตราด': 'ตราด',
        'trat': 'ตราด',
        // Western provinces
        'กาญจนบุรี': 'กาญจนบุรี',
        'kanchanaburi': 'กาญจนบุรี',
        'ราชบุรี': 'ราชบุรี',
        'ratchaburi': 'ราชบุรี',
        'เพชรบุรี': 'เพชรบุรี',
        'phetchaburi': 'เพชรบุรี',
        'ประจวบคีรีขันธ์': 'ประจวบคีรีขันธ์',
        'prachuap-khiri-khan': 'ประจวบคีรีขันธ์',
        'prachuapkhirikhan': 'ประจวบคีรีขันธ์',
        // Northeastern provinces
        'ขอนแก่น': 'ขอนแก่น',
        'khon-kaen': 'ขอนแก่น',
        'khonkaen': 'ขอนแก่น',
        'อุดรธานี': 'อุดรธานี',
        'udon-thani': 'อุดรธานี',
        'udonthani': 'อุดรธานี',
        'นครราชสีมา': 'นครราชสีมา',
        'nakhon-ratchasima': 'นครราชสีมา',
        'nakhonratchasima': 'นครราชสีมา',
        'อุบลราชธานี': 'อุบลราชธานี',
        'ubon-ratchathani': 'อุบลราชธานี',
        'ubonratchathani': 'อุบลราชธานี',
        'มหาสารคาม': 'มหาสารคาม',
        'mahasarakham': 'มหาสารคาม',
        'ร้อยเอ็ด': 'ร้อยเอ็ด',
        'roiet': 'ร้อยเอ็ด',
        'roi-et': 'ร้อยเอ็ด',
        'กาฬสินธุ์': 'กาฬสินธุ์',
        'kalasin': 'กาฬสินธุ์',
        'สกลนคร': 'สกลนคร',
        'sakon-nakhon': 'สกลนคร',
        'sakonnakhon': 'สกลนคร',
        'บุรีรัมย์': 'บุรีรัมย์',
        'buriram': 'บุรีรัมย์',
        'สุรินทร์': 'สุรินทร์',
        'surin': 'สุรินทร์',
        'ศรีสะเกษ': 'ศรีสะเกษ',
        'si-sa-ket': 'ศรีสะเกษ',
        'sisaket': 'ศรีสะเกษ',
        'ยโสธร': 'ยโสธร',
        'yasothon': 'ยโสธร',
        'ชัยภูมิ': 'ชัยภูมิ',
        'chaiyaphum': 'ชัยภูมิ',
        'อำนาจเจริญ': 'อำนาจเจริญ',
        'amnat-charoen': 'อำนาจเจริญ',
        'amnatcharoen': 'อำนาจเจริญ',
        'หนองบัวลำภู': 'หนองบัวลำภู',
        'nong-bua-lamphu': 'หนองบัวลำภู',
        'nongbualamphu': 'หนองบัวลำภู',
        'เลย': 'เลย',
        'loei': 'เลย',
        'หนองคาย': 'หนองคาย',
        'nong-khai': 'หนองคาย',
        'nongkhai': 'หนองคาย',
        'มุกดาหาร': 'มุกดาหาร',
        'mukdahan': 'มุกดาหาร',
        'นครพนม': 'นครพนม',
        'nakhon-phanom': 'นครพนม',
        'nakhonphanom': 'นครพนม',
        'บึงกาฬ': 'บึงกาฬ',
        'bueng-kan': 'บึงกาฬ',
        'buengkan': 'บึงกาฬ',
        // Southern provinces
        'ภูเก็ต': 'ภูเก็ต',
        'phuket': 'ภูเก็ต',
        'กระบี่': 'กระบี่',
        'krabi': 'กระบี่',
        'พังงา': 'พังงา',
        'phang-nga': 'พังงา',
        'phangnga': 'พังงา',
        'ตรัง': 'ตรัง',
        'trang': 'ตรัง',
        'สงขลา': 'สงขลา',
        'songkhla': 'สงขลา',
        'นครศรีธรรมราช': 'นครศรีธรรมราช',
        'nakhon-si-thammarat': 'นครศรีธรรมราช',
        'nakhonsithammarat': 'นครศรีธรรมราช',
        'สุราษฎร์ธานี': 'สุราษฎร์ธานี',
        'surat-thani': 'สุราษฎร์ธานี',
        'suratthani': 'สุราษฎร์ธานี',
        'พัทลุง': 'พัทลุง',
        'phatthalung': 'พัทลุง',
        'ชุมพร': 'ชุมพร',
        'chumphon': 'ชุมพร',
        'ระนอง': 'ระนอง',
        'ranong': 'ระนอง',
        'สตูล': 'สตูล',
        'satun': 'สตูล',
        'ปัตตานี': 'ปัตตานี',
        'pattani': 'ปัตตานี',
        'ยะลา': 'ยะลา',
        'yala': 'ยะลา',
        'นราธิวาส': 'นราธิวาส',
        'narathiwat': 'นราธิวาส'
      };
      
      // Check if search term matches a province name
      const matchedProvince = provinceMatch[searchLower];
      if (matchedProvince) {
        // If it's a province name, search only by province
        query.province = matchedProvince;
      } else {
        // Otherwise, search in name, nameEn (but not description to avoid false matches)
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nameEn: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    const attractions = await TouristAttraction.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      data: attractions,
      count: attractions.length
    });
  } catch (error) {
    console.error('❌ Error fetching tourist attractions:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดสถานที่ท่องเที่ยว',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/:id
 * Get tourist attraction by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attraction = await TouristAttraction.findOne({ id: id, isActive: true });
    
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสถานที่ท่องเที่ยว'
      });
    }
    
    res.json({
      success: true,
      data: attraction
    });
  } catch (error) {
    console.error('❌ Error fetching tourist attraction:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดสถานที่ท่องเที่ยว',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tourist-attractions/:id/coordinates
 * Update tourist attraction coordinates
 */
router.patch('/:id/coordinates', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, source } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be numbers'
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values'
      });
    }
    
    // Update coordinates in database
    const updated = await TouristAttraction.findOneAndUpdate(
      { id: id },
      {
        $set: {
          'coordinates.latitude': latitude,
          'coordinates.longitude': longitude,
          coordinateSource: source || 'geocoding',
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Coordinates updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('❌ Error updating coordinates:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตพิกัด',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/province/:province
 * Get tourist attractions by province
 */
router.get('/province/:province', async (req, res) => {
  try {
    const { province } = req.params;
    const attractions = await TouristAttraction.find({
      province: province,
      isActive: true
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: attractions,
      count: attractions.length,
      province
    });
  } catch (error) {
    console.error('❌ Error fetching tourist attractions by province:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดสถานที่ท่องเที่ยว',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/category/:category
 * Get tourist attractions by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const attractions = await TouristAttraction.find({
      category: category,
      isActive: true
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: attractions,
      count: attractions.length,
      category
    });
  } catch (error) {
    console.error('❌ Error fetching tourist attractions by category:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดสถานที่ท่องเที่ยว',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/:id/check-in-stats
 * Get check-in statistics for an attraction
 */
router.get('/:id/check-in-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const autoCoordinateUpdateService = require('../services/autoCoordinateUpdateService');
    
    const result = await autoCoordinateUpdateService.getCheckInStats(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'ไม่พบข้อมูล'
      });
    }
    
    res.json({
      success: true,
      data: result.stats
    });
  } catch (error) {
    console.error('❌ Error getting check-in stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tourist-attractions/:id/auto-update-settings
 * Update auto-update settings for an attraction (admin only)
 */
router.patch('/:id/auto-update-settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { autoUpdateEnabled, minCheckInsForUpdate } = req.body;
    
    const attraction = await TouristAttraction.findOne({ id: id });
    
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสถานที่ท่องเที่ยว'
      });
    }
    
    if (autoUpdateEnabled !== undefined) {
      attraction.autoUpdateEnabled = autoUpdateEnabled;
    }
    
    if (minCheckInsForUpdate !== undefined) {
      if (typeof minCheckInsForUpdate !== 'number' || minCheckInsForUpdate < 1) {
        return res.status(400).json({
          success: false,
          message: 'minCheckInsForUpdate must be a number >= 1'
        });
      }
      attraction.minCheckInsForUpdate = minCheckInsForUpdate;
    }
    
    await attraction.save();
    
    res.json({
      success: true,
      message: 'อัปเดตการตั้งค่าสำเร็จ',
      data: {
        autoUpdateEnabled: attraction.autoUpdateEnabled,
        minCheckInsForUpdate: attraction.minCheckInsForUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error updating auto-update settings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า',
      error: error.message
    });
  }
});

/**
 * POST /api/tourist-attractions/:id/force-update-coordinates
 * Force update coordinates from check-ins (admin only)
 */
router.post('/:id/force-update-coordinates', async (req, res) => {
  try {
    const { id } = req.params;
    const autoCoordinateUpdateService = require('../services/autoCoordinateUpdateService');
    
    const result = await autoCoordinateUpdateService.updateCoordinatesFromCheckIns(id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'ไม่สามารถอัปเดตพิกัดได้'
      });
    }
    
    if (!result.updated) {
      return res.json({
        success: true,
        updated: false,
        message: result.message || 'ยังไม่สามารถอัปเดตพิกัดได้ (อาจยังไม่มีข้อมูลเพียงพอ)'
      });
    }
    
    res.json({
      success: true,
      updated: true,
      message: result.message || 'อัปเดตพิกัดสำเร็จ',
      data: {
        oldCoordinates: result.oldCoordinates,
        newCoordinates: result.newCoordinates,
        distanceFromOriginal: result.distanceFromOriginal,
        checkInsUsed: result.checkInsUsed
      }
    });
  } catch (error) {
    console.error('❌ Error forcing coordinate update:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตพิกัด',
      error: error.message
    });
  }
});

module.exports = router;
