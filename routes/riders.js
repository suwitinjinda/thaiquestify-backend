// backend/routes/riders.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Rider = require('../models/Rider');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { auth } = require('../middleware/auth');
const { partnerAuth } = require('../middleware/partnerAuth');
const { adminAuth } = require('../middleware/adminAuth');
const { uploadImage, getSignedUrl } = require('../utils/gcpStorage');

// Multer configuration for file uploads (memory storage for GCP upload)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory to upload to GCP
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper function to get file extension
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mimeType] || 'jpg';
}

// Register as rider (POST /api/rider/register)
router.post('/register', auth, upload.fields([
  { name: 'idCardImage', maxCount: 1 },
  { name: 'driverLicenseImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      idCardNumber,
      phone,
      address,
      district,
      province,
      latitude,
      longitude
    } = req.body;

    // Check if user already has a rider registration
    const existingRider = await Rider.findOne({ user: userId });
    if (existingRider) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้สมัครเป็น Rider ไปแล้ว'
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !idCardNumber || !phone || !province) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
      });
    }

    if (!req.files?.idCardImage || !req.files?.driverLicenseImage) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัพโหลดรูปบัตรประชาชนและใบขับขี่'
      });
    }

    // Upload images to GCP bucket
    const idCardFile = req.files.idCardImage[0];
    const driverLicenseFile = req.files.driverLicenseImage[0];

    const idCardFileName = `riders/${userId}/idCard_${Date.now()}.${getFileExtension(idCardFile.mimetype)}`;
    const driverLicenseFileName = `riders/${userId}/driverLicense_${Date.now()}.${getFileExtension(driverLicenseFile.mimetype)}`;

    let idCardImageUrl, driverLicenseImageUrl;

    try {
      // Upload to GCP
      idCardImageUrl = await uploadImage(idCardFile.buffer, idCardFileName, idCardFile.mimetype);
      driverLicenseImageUrl = await uploadImage(driverLicenseFile.buffer, driverLicenseFileName, driverLicenseFile.mimetype);

      console.log('✅ Rider images uploaded to GCP:', {
        idCard: idCardImageUrl,
        driverLicense: driverLicenseImageUrl
      });
    } catch (uploadError) {
      console.error('❌ Error uploading images to GCP:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
        error: uploadError.message
      });
    }

    // Create rider registration
    const rider = new Rider({
      user: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idCardNumber: idCardNumber.replace(/[-\s]/g, ''),
      phone: phone.replace(/[-\s]/g, ''),
      address: address?.trim() || '',
      district: district?.trim() || '',
      province: province.trim(),
      coordinates: (latitude && longitude) ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      } : null,
      idCardImage: idCardImageUrl,
      driverLicenseImage: driverLicenseImageUrl,
      status: 'pending',
      submittedAt: new Date()
    });

    await rider.save();

    console.log('✅ Rider registration created:', rider._id);

    res.json({
      success: true,
      message: 'สมัครเป็น Rider สำเร็จ รอการอนุมัติจาก Partner และ Admin',
      data: {
        riderId: rider._id,
        status: rider.status,
        submittedAt: rider.submittedAt
      }
    });
  } catch (error) {
    console.error('❌ Error registering rider:', error);

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครเป็น Rider',
      error: error.message
    });
  }
});

// Get rider status (GET /api/rider/status)
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const rider = await Rider.findOne({ user: userId })
      .populate('adminApproval.reviewedBy', 'name email')
      .lean();

    if (!rider) {
      return res.json({
        success: true,
        hasRegistration: false,
        status: null
      });
    }

    res.json({
      success: true,
      hasRegistration: true,
      data: {
        status: rider.status,
        riderCode: rider.riderCode,
        submittedAt: rider.submittedAt,
        partnerApproval: rider.partnerApproval,
        adminApproval: rider.adminApproval,
        isAvailable: rider.isAvailable || false,
        serviceRadius: rider.serviceRadius || 5,
        coordinates: rider.coordinates
      }
    });
  } catch (error) {
    console.error('❌ Error getting rider status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ',
      error: error.message
    });
  }
});

// Get rider profile (GET /api/rider/profile)
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const rider = await Rider.findOne({ user: userId })
      .populate('user', 'name email phone')
      .populate('partnerApproval.partnerId', 'partnerName partnerCode')
      .lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    // Generate signed URLs for images if they exist
    let idCardImageUrl = rider.idCardImage;
    let driverLicenseImageUrl = rider.driverLicenseImage;

    if (rider.idCardImage) {
      try {
        idCardImageUrl = await getSignedUrl(rider.idCardImage);
      } catch (error) {
        console.error('Error generating signed URL for idCard:', error);
      }
    }

    if (rider.driverLicenseImage) {
      try {
        driverLicenseImageUrl = await getSignedUrl(rider.driverLicenseImage);
      } catch (error) {
        console.error('Error generating signed URL for driverLicense:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...rider,
        idCardImage: idCardImageUrl,
        driverLicenseImage: driverLicenseImageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error getting rider profile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Rider',
      error: error.message
    });
  }
});

// Toggle rider availability (PUT /api/rider/availability)
router.put('/availability', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable } = req.body;

    const rider = await Rider.findOne({ user: userId });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถเปลี่ยนสถานะการรับงานได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    rider.isAvailable = isAvailable === true;
    rider.updatedAt = new Date();
    await rider.save();

    res.json({
      success: true,
      message: rider.isAvailable ? 'เปิดการรับงานแล้ว' : 'ปิดการรับงานแล้ว',
      data: {
        isAvailable: rider.isAvailable
      }
    });
  } catch (error) {
    console.error('❌ Error toggling rider availability:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ',
      error: error.message
    });
  }
});

// Update service radius (PUT /api/rider/service-radius)
router.put('/service-radius', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRadius } = req.body;

    if (!serviceRadius || serviceRadius < 1 || serviceRadius > 50) {
      return res.status(400).json({
        success: false,
        message: 'รัศมีการรับงานต้องอยู่ระหว่าง 1-50 กิโลเมตร'
      });
    }

    const rider = await Rider.findOne({ user: userId });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถปรับรัศมีการรับงานได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    rider.serviceRadius = serviceRadius;
    rider.updatedAt = new Date();
    await rider.save();

    res.json({
      success: true,
      message: 'อัปเดตรัศมีการรับงานสำเร็จ',
      data: {
        serviceRadius: rider.serviceRadius
      }
    });
  } catch (error) {
    console.error('❌ Error updating service radius:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตรัศมี',
      error: error.message
    });
  }
});

// Update rider location (PUT /api/rider/location)
router.put('/location', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุตำแหน่ง (latitude และ longitude)'
      });
    }

    const rider = await Rider.findOne({ user: userId });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถอัปเดตตำแหน่งได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    rider.coordinates = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };
    rider.lastLocationUpdate = new Date();
    rider.updatedAt = new Date();
    await rider.save();

    res.json({
      success: true,
      message: 'อัปเดตตำแหน่งสำเร็จ',
      data: {
        coordinates: rider.coordinates,
        lastLocationUpdate: rider.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error updating rider location:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง',
      error: error.message
    });
  }
});

// Get available riders in radius (GET /api/rider/available)
// This endpoint can be used by shops to find available riders
router.get('/available', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุตำแหน่ง (latitude และ longitude)'
      });
    }

    const searchLat = parseFloat(latitude);
    const searchLng = parseFloat(longitude);
    const searchRadius = radius ? parseFloat(radius) : 5; // Default 5 km

    // Find active and available riders with coordinates
    const riders = await Rider.find({
      status: 'active',
      isAvailable: true,
      'coordinates.latitude': { $exists: true, $ne: null },
      'coordinates.longitude': { $exists: true, $ne: null }
    })
      .populate('user', 'name email phone')
      .lean();

    // Calculate distance and filter by radius
    const availableRiders = riders
      .map(rider => {
        const distance = calculateDistance(
          searchLat,
          searchLng,
          rider.coordinates.latitude,
          rider.coordinates.longitude
        );
        return {
          ...rider,
          distance: distance
        };
      })
      .filter(rider => rider.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: availableRiders,
      count: availableRiders.length
    });
  } catch (error) {
    console.error('❌ Error getting available riders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหา Rider',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Partner approval routes removed - only admin can approve now

// Admin approve rider (POST /api/rider/:riderId/admin-approve)
router.post('/:riderId/admin-approve', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const reviewerId = req.user.id;

    const rider = await Rider.findById(riderId).populate('user');

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Rider มีสถานะ ${rider.status} แล้ว ไม่สามารถอนุมัติได้ (ต้องเป็น pending)`
      });
    }

    // Generate unique rider code
    let riderCode;
    let attempts = 0;
    do {
      riderCode = `RID${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      attempts++;
      if (attempts > 10) {
        throw new Error('ไม่สามารถสร้าง Rider Code ได้');
      }
    } while (await Rider.findOne({ riderCode }));

    // Update admin approval and generate rider code
    rider.adminApproval = {
      approvedAt: new Date(),
      reviewedBy: reviewerId
    };
    rider.riderCode = riderCode;
    rider.status = 'active';
    rider.updatedAt = new Date();

    await rider.save();

    console.log(`✅ Rider ${riderId} approved by Admin. Rider Code: ${riderCode}`);

    res.json({
      success: true,
      message: 'อนุมัติ Rider สำเร็จ',
      data: {
        riderId: rider._id,
        status: rider.status,
        riderCode: rider.riderCode,
        adminApproval: rider.adminApproval
      }
    });
  } catch (error) {
    console.error('❌ Error approving rider by admin:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติ',
      error: error.message
    });
  }
});

// Admin reject rider (POST /api/rider/:riderId/admin-reject)
router.post('/:riderId/admin-reject', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const { rejectionReason } = req.body;
    const reviewerId = req.user.id;

    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (!['pending', 'active'].includes(rider.status)) {
      return res.status(400).json({
        success: false,
        message: `Rider ไม่สามารถปฏิเสธได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    // Update admin rejection
    rider.adminApproval = {
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || 'ไม่มีเหตุผล',
      reviewedBy: reviewerId
    };
    rider.status = 'rejected';
    rider.updatedAt = new Date();

    await rider.save();

    console.log(`❌ Rider ${riderId} rejected by Admin`);

    res.json({
      success: true,
      message: 'ปฏิเสธการสมัคร Rider สำเร็จ',
      data: {
        riderId: rider._id,
        status: rider.status,
        adminApproval: rider.adminApproval
      }
    });
  } catch (error) {
    console.error('❌ Error rejecting rider by admin:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธ',
      error: error.message
    });
  }
});

// Admin suspend rider (POST /api/rider/:riderId/admin-suspend)
router.post('/:riderId/admin-suspend', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const { suspensionReason } = req.body;
    const reviewerId = req.user.id;

    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Rider ไม่สามารถ suspend ได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    // Update admin suspension
    rider.adminApproval = {
      ...rider.adminApproval,
      suspendedAt: new Date(),
      suspensionReason: suspensionReason || 'ไม่มีเหตุผล',
      reviewedBy: reviewerId
    };
    rider.status = 'suspended';
    rider.updatedAt = new Date();

    await rider.save();

    console.log(`⚠️ Rider ${riderId} suspended by Admin`);

    res.json({
      success: true,
      message: 'Suspend Rider สำเร็จ',
      data: {
        riderId: rider._id,
        status: rider.status,
        adminApproval: rider.adminApproval
      }
    });
  } catch (error) {
    console.error('❌ Error suspending rider by admin:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ suspend',
      error: error.message
    });
  }
});

// Admin reactivate suspended rider (POST /api/rider/:riderId/admin-reactivate)
router.post('/:riderId/admin-reactivate', auth, adminAuth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const reviewerId = req.user.id;

    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    if (rider.status !== 'suspended') {
      return res.status(400).json({
        success: false,
        message: `Rider ไม่สามารถ reactivate ได้ (สถานะปัจจุบัน: ${rider.status})`
      });
    }

    // Reactivate rider
    rider.status = 'active';
    rider.adminApproval = {
      ...rider.adminApproval,
      suspendedAt: null,
      suspensionReason: null,
      reviewedBy: reviewerId
    };
    rider.updatedAt = new Date();

    await rider.save();

    console.log(`✅ Rider ${riderId} reactivated by Admin`);

    res.json({
      success: true,
      message: 'Reactivate Rider สำเร็จ',
      data: {
        riderId: rider._id,
        status: rider.status,
        adminApproval: rider.adminApproval
      }
    });
  } catch (error) {
    console.error('❌ Error reactivating rider by admin:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ reactivate',
      error: error.message
    });
  }
});

// Get all riders for Admin (GET /api/rider/admin/all)
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const riders = await Rider.find(query)
      .populate('user', 'name email phone')
      .populate('adminApproval.reviewedBy', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Rider.countDocuments(query);

    // Generate signed URLs for images so admin can view them
    const ridersWithSignedUrls = await Promise.all(
      riders.map(async (rider) => {
        let idCardImageUrl = rider.idCardImage;
        let driverLicenseImageUrl = rider.driverLicenseImage;

        if (rider.idCardImage) {
          try {
            idCardImageUrl = await getSignedUrl(rider.idCardImage);
          } catch (error) {
            console.error('Error generating signed URL for idCard:', error);
          }
        }

        if (rider.driverLicenseImage) {
          try {
            driverLicenseImageUrl = await getSignedUrl(rider.driverLicenseImage);
          } catch (error) {
            console.error('Error generating signed URL for driverLicense:', error);
          }
        }

        return {
          ...rider,
          idCardImage: idCardImageUrl,
          driverLicenseImage: driverLicenseImageUrl
        };
      })
    );

    res.json({
      success: true,
      data: ridersWithSignedUrls,
      count: ridersWithSignedUrls.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error getting riders for admin:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
});

// Get rider details with images (for Partner/Admin review - GET /api/rider/:riderId)
router.get('/:riderId', auth, async (req, res) => {
  try {
    const { riderId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    const rider = await Rider.findById(riderId)
      .populate('user', 'name email phone')
      .populate('adminApproval.reviewedBy', 'name email')
      .lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล Rider'
      });
    }

    // Check permissions: User can view own, Partner can view pending in their province, Admin can view all
    if (rider.user._id.toString() !== userId && userType !== 'admin') {
      // Check if user is partner and rider is in their province
      if (userType !== 'partner' || rider.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Generate signed URLs for images
    let idCardImageUrl = rider.idCardImage;
    let driverLicenseImageUrl = rider.driverLicenseImage;

    if (rider.idCardImage) {
      try {
        idCardImageUrl = await getSignedUrl(rider.idCardImage);
      } catch (error) {
        console.error('Error generating signed URL for idCard:', error);
      }
    }

    if (rider.driverLicenseImage) {
      try {
        driverLicenseImageUrl = await getSignedUrl(rider.driverLicenseImage);
      } catch (error) {
        console.error('Error generating signed URL for driverLicense:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...rider,
        idCardImage: idCardImageUrl,
        driverLicenseImage: driverLicenseImageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error getting rider details:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message
    });
  }
});

module.exports = router;
