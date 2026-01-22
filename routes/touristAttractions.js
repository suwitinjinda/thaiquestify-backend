const express = require('express');
const router = express.Router();
const TouristAttraction = require('../models/TouristAttraction');
const { auth } = require('../middleware/auth');

/**
 * GET /api/tourist-attractions
 * Get all tourist attractions (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { province, category, search } = req.query;

    // Build query - only show approved and active attractions
    const query = { 
      isActive: true,
      $or: [
        { status: 'active' },
        { status: 'approved' },
        { status: { $exists: false } } // Backward compatibility for old records
      ]
    };

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

/**
 * POST /api/tourist-attractions/upload-images
 * Upload images for tourist attraction submission (partner only)
 */
router.post('/upload-images', auth, async (req, res) => {
  try {
    // Check if user is a partner
    if (!req.user.partnerId && req.user.userType !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partners only.'
      });
    }

    const { images } = req.body; // Array of { data: base64String, mimeType: string }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    if (images.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 images allowed'
      });
    }

    try {
      const { uploadTouristAttractionImages } = require('../utils/gcpStorage');
      const imageBuffers = [];

      for (const img of images) {
        if (!img.data || typeof img.data !== 'string') {
          console.warn('⚠️ Skipping invalid image data');
          continue;
        }

        imageBuffers.push({
          buffer: Buffer.from(img.data, 'base64'),
          mimeType: img.mimeType || 'image/jpeg',
        });
      }

      if (imageBuffers.length > 0) {
        const userId = req.user.id || req.user._id;
        const uploadedUrls = await uploadTouristAttractionImages(imageBuffers, userId);
        console.log(`✅ Uploaded ${uploadedUrls.length} images to GCP for tourist attraction submission`);

        // Convert to signed URLs for frontend access
        const { getSignedUrls } = require('../utils/gcpStorage');
        const signedUrls = await getSignedUrls(uploadedUrls);

        res.json({
          success: true,
          urls: signedUrls,
          count: signedUrls.length,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No valid images to upload',
        });
      }
    } catch (uploadError) {
      console.error('❌ Error uploading images to GCP:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Error uploading images to GCP',
        error: uploadError.message,
      });
    }
  } catch (error) {
    console.error('❌ Error in upload-images endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing image upload request',
      error: error.message,
    });
  }
});

/**
 * POST /api/tourist-attractions/submit
 * Submit a new tourist attraction for approval (partner only)
 */
router.post('/submit', auth, async (req, res) => {
  try {
    // Check if user is a partner
    if (!req.user.partnerId && req.user.userType !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partners only.'
      });
    }

    const {
      name,
      nameEn,
      description,
      coordinates, // { latitude, longitude }
      province,
      district,
      address,
      category, // single category for backward compatibility
      categories, // array of categories
      checkInRadius,
      photos, // Array of 3 photo URLs
      michelinRating,
      michelinStars
    } = req.body;

    // Validate required fields
    if (!name || !coordinates || !coordinates.latitude || !coordinates.longitude || !province) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, coordinates (latitude, longitude), province'
      });
    }

    if (!photos || !Array.isArray(photos) || photos.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 3 photos are required'
      });
    }

    // Check for duplicates (nearby places with similar names)
    const duplicateCheck = await TouristAttraction.findOne({
      name: { $regex: new RegExp(name, 'i') },
      'coordinates.latitude': {
        $gte: coordinates.latitude - 0.01, // ~1km radius
        $lte: coordinates.latitude + 0.01
      },
      'coordinates.longitude': {
        $gte: coordinates.longitude - 0.01,
        $lte: coordinates.longitude + 0.01
      },
      status: { $ne: 'rejected' } // Don't count rejected as duplicates
    });

    if (duplicateCheck) {
      return res.status(400).json({
        success: false,
        message: 'A similar place already exists nearby. Please verify this is a new location.',
        duplicate: {
          id: duplicateCheck._id,
          name: duplicateCheck.name,
          distance: 'nearby'
        }
      });
    }

    // Generate unique ID
    const uniqueId = `TA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine categories
    let finalCategories = ['other'];
    if (categories && Array.isArray(categories) && categories.length > 0) {
      finalCategories = categories;
    } else if (category) {
      finalCategories = [category];
    }

    // Create new tourist attraction with pending status
    const newAttraction = new TouristAttraction({
      id: uniqueId,
      name,
      nameEn: nameEn || '',
      description: description || '',
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      },
      province,
      district: district || '',
      address: address || '',
      category: finalCategories[0], // For backward compatibility
      categories: finalCategories,
      checkInRadius: checkInRadius || 100,
      photos: photos.slice(0, 3), // Ensure only 3 photos
      thumbnail: photos[0], // First photo as thumbnail
      isActive: false, // Inactive until approved
      status: 'pending',
      submittedBy: req.user.id || req.user._id,
      submittedAt: new Date(),
      coordinateSource: 'manual',
      michelinRating: michelinRating || null,
      michelinStars: michelinStars || null
    });

    await newAttraction.save();

    res.json({
      success: true,
      message: 'Tourist attraction submitted successfully. Waiting for admin approval.',
      data: newAttraction
    });
  } catch (error) {
    console.error('❌ Error submitting tourist attraction:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting tourist attraction',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/pending
 * Get all pending submissions (admin only)
 */
router.get('/pending', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const pendingAttractions = await TouristAttraction.find({ status: 'pending' })
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: pendingAttractions,
      count: pendingAttractions.length
    });
  } catch (error) {
    console.error('❌ Error fetching pending attractions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending attractions',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tourist-attractions/:id/approve
 * Approve a pending tourist attraction (admin only)
 */
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const attraction = await TouristAttraction.findById(req.params.id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    if (attraction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Current status: ${attraction.status}`
      });
    }

    // Approve the attraction
    attraction.status = 'approved';
    attraction.isActive = true;
    attraction.approvedBy = req.user.id || req.user._id;
    attraction.approvedAt = new Date();

    await attraction.save();

    res.json({
      success: true,
      message: 'Tourist attraction approved successfully',
      data: attraction
    });
  } catch (error) {
    console.error('❌ Error approving tourist attraction:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving tourist attraction',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tourist-attractions/:id/reject
 * Reject a pending tourist attraction (admin only)
 */
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const attraction = await TouristAttraction.findById(req.params.id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    if (attraction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current status: ${attraction.status}`
      });
    }

    // Reject the attraction
    attraction.status = 'rejected';
    attraction.isActive = false;
    attraction.rejectionReason = reason.trim();

    await attraction.save();

    // TODO: Send notification to partner about rejection

    res.json({
      success: true,
      message: 'Tourist attraction rejected',
      data: attraction
    });
  } catch (error) {
    console.error('❌ Error rejecting tourist attraction:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting tourist attraction',
      error: error.message
    });
  }
});

/**
 * GET /api/tourist-attractions/my-submissions
 * Get partner's own submissions (partner only)
 */
router.get('/my-submissions', auth, async (req, res) => {
  try {
    // Check if user is a partner
    if (!req.user.partnerId && req.user.userType !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partners only.'
      });
    }

    const submissions = await TouristAttraction.find({
      submittedBy: req.user.id || req.user._id
    })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    console.error('❌ Error fetching my submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tourist-attractions/:id/resubmit
 * Edit and resubmit a rejected tourist attraction (partner only)
 */
router.patch('/:id/resubmit', auth, async (req, res) => {
  try {
    // Check if user is a partner
    if (!req.user.partnerId && req.user.userType !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partners only.'
      });
    }

    const attraction = await TouristAttraction.findById(req.params.id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Tourist attraction not found'
      });
    }

    // Check ownership
    const submittedById = attraction.submittedBy?.toString() || attraction.submittedBy;
    const userId = (req.user.id || req.user._id).toString();
    if (submittedById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own submissions.'
      });
    }

    if (attraction.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot resubmit. Current status: ${attraction.status}`
      });
    }

    // Update fields from request body
    const {
      name,
      nameEn,
      description,
      coordinates,
      province,
      district,
      address,
      categories,
      checkInRadius,
      photos,
      michelinRating,
      michelinStars
    } = req.body;

    if (name) attraction.name = name;
    if (nameEn !== undefined) attraction.nameEn = nameEn;
    if (description !== undefined) attraction.description = description;
    if (coordinates) {
      attraction.coordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
    }
    if (province) attraction.province = province;
    if (district !== undefined) attraction.district = district;
    if (address !== undefined) attraction.address = address;
    if (categories && Array.isArray(categories)) {
      attraction.categories = categories;
      attraction.category = categories[0]; // Backward compatibility
    }
    if (checkInRadius) attraction.checkInRadius = checkInRadius;
    if (photos && Array.isArray(photos) && photos.length >= 3) {
      attraction.photos = photos.slice(0, 3);
      attraction.thumbnail = photos[0];
    }
    if (michelinRating !== undefined) attraction.michelinRating = michelinRating;
    if (michelinStars !== undefined) attraction.michelinStars = michelinStars;

    // Reset status to pending
    attraction.status = 'pending';
    attraction.isActive = false;
    attraction.submittedAt = new Date();
    attraction.rejectionReason = null; // Clear rejection reason

    await attraction.save();

    res.json({
      success: true,
      message: 'Tourist attraction resubmitted successfully',
      data: attraction
    });
  } catch (error) {
    console.error('❌ Error resubmitting tourist attraction:', error);
    res.status(500).json({
      success: false,
      message: 'Error resubmitting tourist attraction',
      error: error.message
    });
  }
});

module.exports = router;
