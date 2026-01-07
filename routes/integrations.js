const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { auth } = require('../middleware/auth');
const User = require('../models/User');

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI =
    process.env.TIKTOK_REDIRECT_URI || 'https://thaiquestify.com/auth/tiktok/callback';

// ---------------------------------------
// TikTok Integration (Connect for Quests)
// ---------------------------------------

// GET /api/integrations/tiktok/status
router.get('/tiktok/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const tiktok = user?.integrations?.tiktok;

        const connected = !!(tiktok?.connectedAt && tiktok?.openId);
        const username = tiktok?.displayName || null;
        const profileUrl = username ? `https://www.tiktok.com/@${encodeURIComponent(username)}` : null;

        return res.json({
            success: true,
            connected,
            openId: tiktok?.openId || null,
            username,
            profileUrl,
            followerCount: 0, // user.info.basic does NOT include followers
            lastSynced: tiktok?.connectedAt || null,
        });
    } catch (error) {
        console.error('❌ TikTok status error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get TikTok status' });
    }
});

// POST /api/integrations/tiktok/start
router.post('/tiktok/start', auth, async (req, res) => {
    try {
        if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET is not configured',
            });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
        const state = jwt.sign(
            { purpose: 'tiktok_connect', userId: req.user.id },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        const scope = 'user.info.basic';

        const url =
            `https://www.tiktok.com/v2/auth/authorize/` +
            `?client_key=${encodeURIComponent(TIKTOK_CLIENT_KEY)}` +
            `&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${encodeURIComponent(state)}`;

        return res.json({ success: true, url });
    } catch (error) {
        console.error('❌ TikTok start error:', error);
        return res.status(500).json({ success: false, message: 'Failed to start TikTok connection' });
    }
});

// POST /api/integrations/tiktok/disconnect
router.post('/tiktok/disconnect', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                'integrations.tiktok.connectedAt': null,
                'integrations.tiktok.openId': null,
                'integrations.tiktok.unionId': null,
                'integrations.tiktok.displayName': null,
                'integrations.tiktok.avatarUrl': null,
                'integrations.tiktok.accessToken': null,
                'integrations.tiktok.refreshToken': null,
                'integrations.tiktok.expiresAt': null,
                'integrations.tiktok.scope': null,
            },
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('❌ TikTok disconnect error:', error);
        return res.status(500).json({ success: false, message: 'Failed to disconnect TikTok' });
    }
});

module.exports = router;