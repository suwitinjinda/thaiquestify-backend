const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const QuestSettings = require('../models/QuestSettings');
const PointTransaction = require('../models/PointTransaction');
const PointSystem = require('../models/PointSystem');
const ShopFeeSplitRecord = require('../models/ShopFeeSplitRecord');
const { auth } = require('../middleware/auth');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs (with filters, search, pagination)
 * @query   category, province, status, employer, shop, q (search jobNumber/title), page, limit
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      province,
      status,
      employer,
      shop,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (province) query['location.province'] = province;
    if (status) query.status = status;
    if (employer) query.employer = employer;
    if (shop) query.shop = shop;

    if (q && typeof q === 'string' && q.trim()) {
      const trimQ = q.trim();
      const numMatch = /^JOB\d+$/i.test(trimQ);
      if (numMatch) {
        query.jobNumber = new RegExp(`^${trimQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      } else {
        query.$or = [
          { title: new RegExp(trimQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { jobNumber: new RegExp(trimQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        ];
      }
    }

    const skip = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const jobs = await Job.find(query)
      .populate('employer', 'name email phone')
      .populate('shop', 'shopName shopId')
      .populate('worker', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page, 10) || 1,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/by-number/:jobNumber
 * @desc    Get job by jobNumber (e.g. JOB20260118000001)
 * @access  Public
 */
router.get('/by-number/:jobNumber', async (req, res) => {
  try {
    const jobNumber = req.params.jobNumber?.trim();
    if (!jobNumber) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเลขที่งาน (jobNumber)' });
    }
    const job = await Job.findOne({ jobNumber: new RegExp(`^${jobNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      .populate('employer', 'name email phone')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('worker', 'name email phone');

    if (!job) {
      return res.status(404).json({ success: false, message: 'ไม่พบงาน' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Error fetching job by number:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name email phone')
      .populate('shop', 'shopName shopId phone address coordinates')
      .populate('worker', 'name email phone');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงาน',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs
 * @desc    Create new job
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Validate category
    const validCategories = ['delivery', 'kitchen', 'service', 'sales', 'handyman', 'agriculture', 'other'];
    if (req.body.category && !validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: `ประเภทงานไม่ถูกต้อง: ${req.body.category}. ประเภทที่อนุญาต: ${validCategories.join(', ')}`,
      });
    }

    const jobData = {
      ...req.body,
      employer: userId,
    };

    console.log('📝 Creating job with data:', {
      title: jobData.title,
      category: jobData.category,
      employer: userId,
    });

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'name email phone')
      .populate('shop', 'shopName shopId');

    // Notify users within job search radius (fire-and-forget)
    const coords = job.location?.coordinates;
    const lat = coords?.latitude;
    const lng = coords?.longitude;
    const radiusKm = typeof job.searchRadius === 'number' && job.searchRadius > 0 ? job.searchRadius : 10;
    const employerId = job.employer._id || job.employer;

    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      setImmediate(async () => {
        try {
          const deliveryAssignmentService = require('../services/deliveryAssignmentService');
          const { createJobNewNearbyNotification } = require('../utils/notificationHelper');
          const candidates = await User.find({
            _id: { $ne: employerId },
            'coordinates.latitude': { $exists: true, $ne: null },
            'coordinates.longitude': { $exists: true, $ne: null },
          })
            .select('_id coordinates')
            .limit(500)
            .lean();

          const within = [];
          for (const u of candidates) {
            const d = deliveryAssignmentService.calculateDistance(
              lat,
              lng,
              u.coordinates.latitude,
              u.coordinates.longitude
            );
            if (d <= radiusKm) within.push({ _id: u._id, distance: d });
          }
          within.sort((a, b) => a.distance - b.distance);
          const toNotify = within.slice(0, 200);

          await Promise.allSettled(
            toNotify.map(({ _id, distance }) =>
              createJobNewNearbyNotification(_id, job.title, job.jobNumber, job._id, distance)
            )
          );
          if (toNotify.length > 0) {
            console.log(`   📢 Sent "job new nearby" to ${toNotify.length} users within ${radiusKm} km`);
          }
        } catch (e) {
          console.warn('⚠️ Job new-nearby notifications failed:', e?.message || e);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'สร้างงานสำเร็จ',
      data: populatedJob,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างงาน',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job
 * @access  Private (employer only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id || req.user._id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงาน',
      });
    }

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขงานนี้',
      });
    }

    Object.assign(job, req.body);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'name email phone')
      .populate('shop', 'shopName shopId');

    res.json({
      success: true,
      message: 'อัปเดตงานสำเร็จ',
      data: populatedJob,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตงาน',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job
 * @access  Private (employer only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id || req.user._id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงาน',
      });
    }

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบงานนี้',
      });
    }

    // Cancel job instead of delete
    job.status = 'cancelled';
    await job.save();

    res.json({
      success: true,
      message: 'ยกเลิกงานสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply for job
 * @access  Private
 */
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id || req.user._id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงาน',
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'งานนี้ไม่เปิดรับสมัคร',
      });
    }

    if (job.employer.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'คุณไม่สามารถสมัครงานของตัวเองได้',
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      worker: userId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้สมัครงานนี้แล้ว',
      });
    }

    // Create application (using existing JobApplication model)
    // Note: JobApplication currently references UserGeneratedQuest, 
    // but we can adapt it or create a new application model
    const application = new JobApplication({
      job: jobId,
      worker: userId,
      employer: job.employer,
      message: req.body.message || '',
    });

    await application.save();

    // Notify employer that someone applied
    try {
      const workerUser = await User.findById(userId).select('name').lean();
      const { createJobApplicationNewNotification } = require('../utils/notificationHelper');
      await createJobApplicationNewNotification(
        job.employer,
        workerUser?.name || 'มีผู้สมัคร',
        job.title,
        job.jobNumber,
        job._id,
        application._id
      );
    } catch (notifErr) {
      console.warn('⚠️ Job application new notification failed:', notifErr?.message || notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'สมัครงานสำเร็จ',
      data: application,
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครงาน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/applications/my
 * @desc    Get current user's job applications
 * @access  Private
 */
router.get('/applications/my', auth, async (req, res) => {
  try {
    console.log('📋 [GET /api/jobs/applications/my] Request received');
    const userId = req.user.id || req.user._id;
    console.log('   User ID:', userId);
    
    // First, get applications without populate
    let applications = await JobApplication.find({ worker: userId })
      .populate('employer', 'name email phone')
      .sort({ createdAt: -1 });

    console.log(`   Found ${applications.length} applications`);
    
    // Manually populate job for each application
    const Job = require('../models/Job');
    for (let app of applications) {
      // Check if job is already populated with full data
      const isFullyPopulated = app.job && 
                               typeof app.job === 'object' && 
                               app.job._id && 
                               app.job.title; // Check if title exists
      
      if (isFullyPopulated) {
        console.log(`   ✅ Application ${app._id} already has populated job: ${app.job.title}`);
        continue;
      }
      
      // Get job ID (either from ObjectId or from populated object)
      const jobId = app.job?._id || app.job;
      
      if (jobId) {
        try {
          const User = require('../models/User');
          const job = await Job.findById(jobId)
            .select('title description category location salary status startDate endDate employer requiredWorkers ageRequirement contact jobNumber searchRadius');
          
          if (job) {
            // Debug: Check employer before populate
            console.log(`   🔍 Job ${job._id} - employer type before populate:`, typeof job.employer, job.employer);
            
            // Try to populate employer
            if (job.employer) {
              if (typeof job.employer === 'string' || (job.employer && !job.employer.name)) {
                // Employer is an ID string or not fully populated, fetch it manually
                try {
                  const employerId = typeof job.employer === 'string' ? job.employer : job.employer._id || job.employer;
                  const employerUser = await User.findById(employerId).select('name email phone username');
                  if (employerUser) {
                    job.employer = employerUser;
                    console.log(`   ✅ Manually populated employer for job ${job._id}: ${employerUser.name || employerUser.username || employerUser.email}`);
                  } else {
                    console.log(`   ⚠️ Employer user not found for ID: ${employerId}`);
                  }
                } catch (err) {
                  console.log(`   ❌ Could not populate employer for job ${job._id}:`, err.message);
                }
              } else {
                console.log(`   ✅ Employer already populated for job ${job._id}: ${job.employer.name || job.employer.username || job.employer.email}`);
              }
            }
            
            // Debug: Check employer after populate
            console.log(`   🔍 Job ${job._id} - employer type after populate:`, typeof job.employer, job.employer?.name || job.employer?.username || job.employer);
            
            app.job = job;
            console.log(`   ✅ Manually populated job for application ${app._id}: ${job.title || 'No title'}`);
          } else {
            console.log(`   ⚠️ Job not found for application ${app._id}, jobId: ${jobId}`);
            app.job = null;
          }
        } catch (err) {
          console.error(`   ❌ Error populating job for application ${app._id}:`, err.message);
          app.job = null;
        }
      } else {
        console.log(`   ⚠️ Application ${app._id} has no job field or jobId`);
      }
    }
    
    // Debug: Check if job is populated
    applications.forEach((app, idx) => {
      console.log(`   Application ${idx}:`, {
        applicationId: app._id,
        hasJob: !!app.job,
        jobId: app.job?._id || app.job,
        jobTitle: app.job?.title,
        status: app.status,
      });
    });
    
    res.json({
      success: true,
      data: applications,
    });
    
    console.log('   ✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Error fetching my applications:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการสมัครงาน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/:id/applications
 * @desc    Get job applications
 * @access  Private (employer only)
 */
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id || req.user._id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงาน',
      });
    }

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูการสมัครงานนี้',
      });
    }

    const applications = await JobApplication.find({ job: jobId })
      .populate('worker', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการสมัครงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/applications/:applicationId/accept
 * @desc    Accept worker application
 * @access  Private (employer only)
 */
router.post('/applications/:applicationId/accept', auth, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.id || req.user._id;

    const application = await JobApplication.findById(applicationId)
      .populate('worker', 'name email phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการสมัครงาน',
      });
    }

    // Get job separately since populate might not work if ref is wrong
    const job = await Job.findById(application.job);

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยอมรับการสมัครงานนี้',
      });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'งานนี้ไม่เปิดรับสมัครแล้ว',
      });
    }

    // Check if application is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `การสมัครงานนี้อยู่สถานะ ${application.status} แล้ว`,
      });
    }

    // Get application fee from settings (default 5 points)
    const applicationFee = await QuestSettings.getSetting('job_application_fee') || 5;
    
    // Get worker user to check and deduct points
    const worker = await User.findById(application.worker);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลคนงาน',
      });
    }

    // Check if worker has enough points
    if (worker.points < applicationFee) {
      return res.status(400).json({
        success: false,
        message: `คนงานมี point ไม่เพียงพอ (มี ${worker.points} point, ต้องการ ${applicationFee} point)`,
      });
    }

    // Deduct points from worker (user pays platform)
    worker.points -= applicationFee;
    await worker.save();

    // Add points to PointSystem (platform receives from user)
    const pointSystem = await PointSystem.getSystem();
    await pointSystem.addPoints(applicationFee, worker._id);

    // Record point transaction for worker (negative amount for user)
    await PointTransaction.create({
      type: 'job_application_fee',
      amount: -applicationFee, // Negative: user pays
      userId: worker._id,
      description: `ค่าธรรมเนียมการสมัครงานสำหรับ "${job.title}"`,
      status: 'completed'
    });

    // Record platform revenue from job application fee (100% platform, 0% partner)
    await ShopFeeSplitRecord.create({
      feeType: 'job_application_fee',
      feeAmount: applicationFee,
      platformShare: applicationFee, // 100% goes to platform
      partnerShare: 0, // No partner commission for job fees
      job: job._id,
      jobApplication: application._id,
      jobNumber: job.jobNumber || '',
      jobTitle: job.title || '',
    });

    console.log(`   💰 หัก ${applicationFee} points จากคนงาน ${worker.name} และเพิ่มให้ PointSystem สำหรับค่าธรรมเนียมการสมัครงาน`);

    // Update application status
    application.status = 'accepted';
    application.acceptedAt = new Date();
    await application.save();

    // Update job status and worker
    job.worker = application.worker._id;
    job.acceptedWorkers = (job.acceptedWorkers || 0) + 1;
    
    // Change job status to 'in_progress' when first worker is accepted
    job.status = 'in_progress';
    
    // Auto-reject all pending applications when job is fully staffed
    if (job.acceptedWorkers >= job.requiredWorkers) {
      const jobId = application.job;
      const pendingApplications = await JobApplication.updateMany(
        {
          job: jobId,
          status: 'pending',
          _id: { $ne: applicationId } // Don't reject the just-accepted application
        },
        {
          status: 'rejected'
        }
      );
      
      console.log(`   ✅ Auto-rejected ${pendingApplications.modifiedCount} pending applications (job fully staffed: ${job.acceptedWorkers}/${job.requiredWorkers})`);

      // Deduct job commission fee from employer when job is fully staffed
      const jobCommissionFee = await QuestSettings.getSetting('job_commission_fee') || 5; // Default to 5 points
      const employerUser = await User.findById(job.employer);

      if (employerUser) {
        // Check if employer has enough points
        if (employerUser.points < jobCommissionFee) {
          console.log(`   ⚠️ Warning: Employer ${employerUser.name} has insufficient points (${employerUser.points} < ${jobCommissionFee}) but job is already fully staffed`);
          // Continue anyway - job is already accepted, but log warning
        } else {
          // Deduct points from employer (user pays platform)
          employerUser.points -= jobCommissionFee;
          await employerUser.save();

          // Add points to PointSystem (platform receives from user)
          const pointSystem = await PointSystem.getSystem();
          await pointSystem.addPoints(jobCommissionFee, employerUser._id);

          // Record point transaction (negative amount for user)
          await PointTransaction.create({
            type: 'job_commission_fee',
            amount: -jobCommissionFee, // Negative: user pays
            userId: employerUser._id,
            description: `ค่านายหน้าจ้างงานสำหรับ "${job.title}" (ได้ลูกจ้างครบ ${job.acceptedWorkers}/${job.requiredWorkers})`,
            status: 'completed'
          });

          // Record platform revenue from job commission fee (100% platform, 0% partner)
          await ShopFeeSplitRecord.create({
            feeType: 'job_commission_fee',
            feeAmount: jobCommissionFee,
            platformShare: jobCommissionFee, // 100% goes to platform
            partnerShare: 0, // No partner commission for job fees
            job: job._id,
            jobNumber: job.jobNumber || '',
            jobTitle: job.title || '',
          });
          
          console.log(`   💰 หัก ${jobCommissionFee} points จากนายจ้าง ${employerUser.name} และเพิ่มให้ PointSystem สำหรับค่านายหน้าจ้างงาน`);
        }
      } else {
        console.log(`   ⚠️ Warning: Employer not found for job ${job._id}`);
      }
    }
    
    await job.save();

    try {
      const { createJobApplicationAcceptedNotification } = require('../utils/notificationHelper');
      const workerId = application.worker._id || application.worker;
      await createJobApplicationAcceptedNotification(
        workerId,
        job.title,
        job.jobNumber,
        job._id,
        application._id
      );
    } catch (notifErr) {
      console.warn('⚠️ Job accept notification failed:', notifErr?.message || notifErr);
    }

    res.json({
      success: true,
      message: 'ยอมรับการสมัครงานสำเร็จ',
      data: application,
    });
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยอมรับการสมัครงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/applications/:applicationId/reject
 * @desc    Reject worker application
 * @access  Private (employer only)
 */
router.post('/applications/:applicationId/reject', auth, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.id || req.user._id;

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการสมัครงาน',
      });
    }

    // Get job separately
    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงานที่เกี่ยวข้องกับการสมัครงานนี้',
      });
    }

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ปฏิเสธการสมัครงานนี้',
      });
    }

    // Check if application is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `การสมัครงานนี้อยู่สถานะ ${application.status} แล้ว`,
      });
    }

    // Update application status
    application.status = 'rejected';
    await application.save();

    try {
      const { createJobApplicationRejectedNotification } = require('../utils/notificationHelper');
      const workerId = application.worker._id || application.worker;
      await createJobApplicationRejectedNotification(
        workerId,
        job.title,
        job.jobNumber,
        job._id,
        application._id
      );
    } catch (notifErr) {
      console.warn('⚠️ Job reject notification failed:', notifErr?.message || notifErr);
    }

    res.json({
      success: true,
      message: 'ปฏิเสธการสมัครงานสำเร็จ',
      data: application,
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธการสมัครงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/applications/:applicationId/complete
 * @desc    Complete job and pay worker
 * @access  Private (employer only)
 */
router.post('/applications/:applicationId/complete', auth, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.id || req.user._id;

    const application = await JobApplication.findById(applicationId)
      .populate('worker', 'name email phone bankAccount');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการสมัครงาน',
      });
    }

    // Get job separately
    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบงานที่เกี่ยวข้องกับการสมัครงานนี้',
      });
    }

    // Check if user is employer
    if (job.employer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์จบงานนี้',
      });
    }

    // Check if application is accepted
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'การสมัครงานนี้ยังไม่ถูกยอมรับ',
      });
    }

    // Check if job is in progress
    if (job.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'งานนี้ยังไม่พร้อมจบ',
      });
    }

    // Update application status
    application.status = 'completed';
    application.completedAt = new Date();
    
    // Payment: worker receives full salary. No completion commission (only job_application_fee + job_commission_fee apply; those go to platform income).
    const salaryAmount = job.salary.amount || 0;
    const workerReceived = salaryAmount;
    
    application.payment = {
      jobAmount: salaryAmount,
      commissionFee: 0,
      workerReceived,
      paidAt: new Date(),
    };
    
    await application.save();

    job.status = 'completed';
    await job.save();

    try {
      const { createJobApplicationCompletedNotification } = require('../utils/notificationHelper');
      const workerId = application.worker._id || application.worker;
      await createJobApplicationCompletedNotification(
        workerId,
        job.title,
        job.jobNumber,
        job._id,
        application._id
      );
    } catch (notifErr) {
      console.warn('⚠️ Job complete notification failed:', notifErr?.message || notifErr);
    }

    res.json({
      success: true,
      message: 'จบงานและจ่ายเงินสำเร็จ',
      data: {
        application,
        payment: {
          totalAmount: salaryAmount,
          commissionFee: 0,
          workerReceived,
        },
      },
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการจบงาน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/fix-accepted-jobs
 * @desc    Fix jobs with accepted applications (auto-update status to in_progress)
 * @access  Private (Admin or Employer)
 */
router.post('/fix-accepted-jobs', auth, async (req, res) => {
  try {
    console.log('🔧 Starting auto-fix for jobs with accepted applications...');
    
    let fixedCount = 0;
    let checkedCount = 0;
    let rejectedCount = 0;
    const fixedJobs = [];

    // Find all accepted applications
    const acceptedApps = await JobApplication.find({ status: 'accepted' });

    for (const app of acceptedApps) {
      checkedCount++;
      
      const job = await Job.findById(app.job);
      
      if (!job) {
        console.warn(`⚠️ Application ${app._id} references non-existent job ${app.job}`);
        continue;
      }
      
      // Check if job needs fixing
      const needsFix = job.status !== 'in_progress' && job.status !== 'completed';
      const needsWorker = !job.worker || (job.worker.toString() !== app.worker.toString());
      const needsAcceptedWorkers = (job.acceptedWorkers || 0) === 0;
      
      if (needsFix || needsWorker || needsAcceptedWorkers) {
        console.log(`🔧 Fixing job: "${job.title}" (${job._id})`);
        
        // Build update object
        const updateObj = {};
        
        if (needsFix) {
          updateObj.status = 'in_progress';
          console.log(`   ✨ Setting status to 'in_progress'`);
        }
        
        if (needsWorker) {
          updateObj.worker = app.worker;
          console.log(`   ✨ Setting worker to ${app.worker}`);
        }
        
        if (needsAcceptedWorkers) {
          updateObj.acceptedWorkers = 1;
          console.log(`   ✨ Setting acceptedWorkers to 1`);
        }
        
        // Update job
        const updatedJob = await Job.findByIdAndUpdate(
          job._id,
          { $set: updateObj },
          { new: true }
        );
        
        if (updatedJob) {
          fixedCount++;
          
          // Check if job is fully staffed and auto-reject pending applications
          const requiredWorkers = job.requiredWorkers || 1;
          const acceptedCount = updatedJob.acceptedWorkers || 1;
          
          if (acceptedCount >= requiredWorkers) {
            const pendingRejectResult = await JobApplication.updateMany(
              {
                job: job._id,
                status: 'pending'
              },
              {
                status: 'rejected'
              }
            );
            
            if (pendingRejectResult.modifiedCount > 0) {
              rejectedCount += pendingRejectResult.modifiedCount;
              console.log(`   ✅ Auto-rejected ${pendingRejectResult.modifiedCount} pending applications (job fully staffed: ${acceptedCount}/${requiredWorkers})`);
            }
          }
          
          fixedJobs.push({
            jobId: job._id,
            title: job.title,
            oldStatus: job.status,
            newStatus: updatedJob.status,
          });
          console.log(`   ✅ Job updated successfully!`);
        }
      }
      
      // Also ensure acceptedAt is set
      if (!app.acceptedAt) {
        console.log(`   ✨ Setting acceptedAt for application ${app._id}`);
        app.acceptedAt = new Date();
        await app.save();
      }
    }

    // Additional check: Find all jobs with acceptedWorkers >= requiredWorkers and reject pending apps
    console.log('\n🔍 Checking for jobs that need auto-reject...');
    const allJobs = await Job.find({
      $expr: { $gte: ['$acceptedWorkers', '$requiredWorkers'] },
      status: { $in: ['open', 'in_progress'] }
    });

    for (const job of allJobs) {
      const pendingRejectResult = await JobApplication.updateMany(
        {
          job: job._id,
          status: 'pending'
        },
        {
          status: 'rejected'
        }
      );
      
      if (pendingRejectResult.modifiedCount > 0) {
        rejectedCount += pendingRejectResult.modifiedCount;
        console.log(`   ✅ Auto-rejected ${pendingRejectResult.modifiedCount} pending applications for job: "${job.title}" (${job.acceptedWorkers}/${job.requiredWorkers})`);
      }
    }

    console.log(`\n📊 Summary: Checked ${checkedCount} applications, Fixed ${fixedCount} jobs, Auto-rejected ${rejectedCount} pending applications`);

    res.json({
      success: true,
      message: `Auto-fix completed: Fixed ${fixedCount} jobs, Auto-rejected ${rejectedCount} applications`,
      data: {
        checked: checkedCount,
        fixed: fixedCount,
        rejected: rejectedCount,
        fixedJobs: fixedJobs,
      },
    });
  } catch (error) {
    console.error('Error in auto-fix:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/settings/public
 * @desc    Get public job settings (no admin required)
 * @access  Public
 */
router.get('/settings/public', async (req, res) => {
  try {
    // Only return essential job settings that users need to know
    const jobCommissionFee = await QuestSettings.findOne({ key: 'job_commission_fee' });
    const jobApplicationFee = await QuestSettings.findOne({ key: 'job_application_fee' });

    const settings = {};
    
    if (jobCommissionFee) {
      settings.job_commission_fee = jobCommissionFee.value;
    } else {
      settings.job_commission_fee = 5; // Default
    }

    if (jobApplicationFee) {
      settings.job_application_fee = jobApplicationFee.value;
    } else {
      settings.job_application_fee = 5; // Default
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public job settings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า',
      error: error.message
    });
  }
});

module.exports = router;
