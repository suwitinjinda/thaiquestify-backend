// routes/userGeneratedQuests.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userGeneratedQuestService = require('../new-services/social/userGeneratedQuestService');

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

// สร้าง quest ใหม่
router.post('/create', auth, async (req, res) => {
    try {
        const quest = await userGeneratedQuestService.createQuest(
            req.user._id,
            req.body
        );
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

module.exports = router;