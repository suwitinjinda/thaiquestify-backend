// routes/userGeneratedQuests.js
// Routes สำหรับ Job Postings (งาน/รับจ้าง)
// Collection: 'jobpostings' - สำหรับงานที่ผู้ใช้สร้าง (ซ่อมแซม, ต่อเติม, งานใช้แรงงาน, etc.)
// แยกจาก 'socialquests' (เควสจากชุมชน - TikTok follow, share URL)
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userGeneratedQuestService = require('../new-services/social/userGeneratedQuestService');
const UserGeneratedQuest = require('../models/UserGeneratedQuest');

// ดึง quests สาธารณะสำหรับ Landing Page
router.get('/public', auth, async (req, res) => {
    try {
        const result = await userGeneratedQuestService.getPublicQuests(
            req.user._id,
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ดึงรายละเอียดงาน
router.get('/:jobId', auth, async (req, res) => {
    try {
        const job = await UserGeneratedQuest.findById(req.params.jobId)
            .populate('creator', 'name photo email');
        if (!job) {
            return res.status(404).json({ success: false, message: 'ไม่พบงานนี้' });
        }
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// สร้าง quest ใหม่
router.post('/create', auth, async (req, res) => {
    try {
        const quest = await userGeneratedQuestService.createQuest(
            req.user._id,
            req.body
        );
        // Re-log with req for IP tracking
        await userGeneratedQuestService.logJobAction('job_created', quest._id, req.user._id, null, null, {
            title: quest.title,
            budget: req.body.details?.budget || 0
        }, req);
        res.json({ success: true, data: quest });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// เข้าร่วม quest
router.post('/:questId/join', auth, async (req, res) => {
    try {
        const participation = await userGeneratedQuestService.joinQuest(
            req.user._id,
            req.params.questId
        );
        res.json({ success: true, data: participation });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ส่งการยืนยัน
router.post('/:questId/verify', auth, async (req, res) => {
    try {
        const result = await userGeneratedQuestService.submitVerification(
            req.user._id,
            req.params.questId,
            req.body
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ดึง quests ที่ผู้ใช้สร้าง
router.get('/my-quests', auth, async (req, res) => {
    try {
        const quests = await userGeneratedQuestService.getUserCreatedQuests(req.user._id);
        res.json({ success: true, data: quests });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ดึง quests ที่ผู้ใช้เข้าร่วม
router.get('/my-participations', auth, async (req, res) => {
    try {
        const participations = await userGeneratedQuestService.getUserParticipations(req.user._id);
        res.json({ success: true, data: participations });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ========== Job Hiring System ==========

// สมัครงาน
router.post('/:jobId/apply', auth, async (req, res) => {
    try {
        const application = await userGeneratedQuestService.applyJob(
            req.user._id,
            req.params.jobId,
            req.body.message || ''
        );
        // Re-log with req
        await userGeneratedQuestService.logJobAction('job_applied', req.params.jobId, req.user._id, application.employer, application._id, {
            message: req.body.message || ''
        }, req);
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ยอมรับคนทำงาน
router.post('/applications/:applicationId/accept', auth, async (req, res) => {
    try {
        const application = await userGeneratedQuestService.acceptWorker(
            req.user._id,
            req.params.applicationId
        );
        // Re-log with req
        await userGeneratedQuestService.logJobAction('job_accepted', application.job._id, req.user._id, application.worker._id, application._id, {}, req);
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ปฏิเสธการสมัครงาน
router.post('/applications/:applicationId/reject', auth, async (req, res) => {
    try {
        const application = await userGeneratedQuestService.rejectWorker(
            req.user._id,
            req.params.applicationId
        );
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// จบงานและจ่ายเงิน
router.post('/applications/:applicationId/complete', auth, async (req, res) => {
    try {
        const application = await userGeneratedQuestService.completeJob(
            req.user._id,
            req.params.applicationId
        );
        // Re-log with req
        await userGeneratedQuestService.logJobAction('job_completed', application.job._id, req.user._id, application.worker._id, application._id, {
            budget: application.payment.jobAmount,
            commissionFee: application.payment.commissionFee,
            workerReceived: application.payment.workerReceived
        }, req);
        await userGeneratedQuestService.logJobAction('payment_processed', application.job._id, req.user._id, application.worker._id, application._id, {
            amount: application.payment.jobAmount,
            commissionFee: application.payment.commissionFee,
            workerReceived: application.payment.workerReceived
        }, req);
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ดึงรายการผู้สมัครงาน
router.get('/:jobId/applications', auth, async (req, res) => {
    try {
        const applications = await userGeneratedQuestService.getJobApplications(
            req.params.jobId,
            req.user._id
        );
        res.json({ success: true, data: applications });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ยกเลิกงาน (สำหรับคนจ้างงาน)
router.post('/:jobId/cancel', auth, async (req, res) => {
    try {
        const job = await userGeneratedQuestService.cancelJob(
            req.user._id,
            req.params.jobId
        );
        // Re-log with req
        await userGeneratedQuestService.logJobAction('job_cancelled', req.params.jobId, req.user._id, null, null, {
            title: job.title
        }, req);
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;