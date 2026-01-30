const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

const { auth } = require('../middleware/auth');
const User = require('../models/User');

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI =
    process.env.TIKTOK_REDIRECT_URI || 'https://thaiquestify.com/auth/tiktok/callback';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI =
    process.env.FACEBOOK_REDIRECT_URI || 'https://thaiquestify.com/auth/facebook/callback';

// ---------------------------------------
// TikTok Integration (Connect for Quests)
// ---------------------------------------

// GET /api/integrations/tiktok/status
router.get('/tiktok/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const tiktok = user?.integrations?.tiktok;
        const connected = !!(tiktok?.connectedAt && tiktok?.openId);
        // Use username if available (e.g., "noom2419"), fallback to displayName (e.g., "noom")
        const username = tiktok?.username || tiktok?.displayName || null;
        const profileUrl = username ? `https://www.tiktok.com/@${encodeURIComponent(username)}` : null;

        // Fetch stats if scope includes user.info.stats
        let stats = null;
        const hasStatsScope = tiktok?.scope?.includes('user.info.stats');

        if (connected && hasStatsScope && tiktok?.accessToken) {
            try {
                const statsResp = await axios.get(
                    'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count',
                    { headers: { Authorization: `Bearer ${tiktok.accessToken}` } }
                );

                const statsData = statsResp.data?.data?.user || {};
                stats = {
                    followerCount: statsData.follower_count || 0,
                    followingCount: statsData.following_count || 0,
                    likesCount: statsData.likes_count || 0,
                    videoCount: statsData.video_count || 0,
                    updatedAt: new Date(),
                };

                // Save stats to database for tracking
                if (user) {
                    user.integrations.tiktok.lastStatsUpdate = new Date();
                    user.integrations.tiktok.stats = stats;
                    await user.save();
                }
            } catch (statsError) {
                if (process.env.DEBUG_TIKTOK === '1') console.warn('⚠️ TikTok stats fetch failed:', statsError?.message || statsError);
                // Use saved stats if fetch fails
                if (tiktok?.stats) {
                    stats = tiktok.stats;
                }
            }
        } else if (connected && tiktok?.stats) {
            // Return saved stats if scope not available but stats exist
            stats = tiktok.stats;
        }

        const responseData = {
            success: true,
            connected,
            openId: tiktok?.openId || null,
            username,
            profileUrl,
            followerCount: stats?.followerCount || tiktok?.stats?.followerCount || 0,
            stats: stats || tiktok?.stats || null,
            lastSynced: tiktok?.connectedAt || null,
            lastStatsUpdate: tiktok?.lastStatsUpdate || null,
        };

        return res.json(responseData);
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

        const scope = 'user.info.basic,user.info.profile,user.info.stats,video.list';

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

// GET /api/integrations/tiktok/stats - Get daily stats update
router.get('/tiktok/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const tiktok = user?.integrations?.tiktok;

        if (!tiktok?.connectedAt || !tiktok?.openId) {
            return res.status(400).json({
                success: false,
                message: 'TikTok account not connected',
            });
        }

        const hasStatsScope = tiktok?.scope?.includes('user.info.stats');
        if (!hasStatsScope) {
            return res.status(403).json({
                success: false,
                message: 'user.info.stats scope not granted',
            });
        }

        if (!tiktok?.accessToken) {
            return res.status(400).json({
                success: false,
                message: 'TikTok access token not available',
            });
        }

        // Fetch stats from TikTok API
        const statsResp = await axios.get(
            'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count',
            { headers: { Authorization: `Bearer ${tiktok.accessToken}` } }
        );

        const statsData = statsResp.data?.data?.user || {};
        const stats = {
            followerCount: statsData.follower_count || 0,
            followingCount: statsData.following_count || 0,
            likesCount: statsData.likes_count || 0,
            videoCount: statsData.video_count || 0,
            updatedAt: new Date(),
        };

        // Optionally save stats to user document for daily tracking
        user.integrations.tiktok.lastStatsUpdate = new Date();
        user.integrations.tiktok.stats = stats;
        await user.save();

        return res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('❌ TikTok stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get TikTok stats',
            error: error?.response?.data || error?.message,
        });
    }
});

// GET /api/integrations/tiktok/videos - Get user videos
router.get('/tiktok/videos', auth, async (req, res) => {
    let tiktok; // Declare outside try block for error handler access

    try {
        const user = await User.findById(req.user.id).select('integrations');
        tiktok = user?.integrations?.tiktok;

        if (!tiktok?.connectedAt || !tiktok?.openId) {
            return res.status(400).json({
                success: false,
                message: 'TikTok account not connected',
            });
        }

        const hasVideoScope = tiktok?.scope?.includes('video.list');
        if (!hasVideoScope) {
            return res.status(403).json({
                success: false,
                message: 'video.list scope not granted',
            });
        }

        if (!tiktok?.accessToken) {
            return res.status(400).json({
                success: false,
                message: 'TikTok access token not available',
            });
        }

        const maxCount = Math.min(parseInt(req.query.max_count) || 10, 20); // TikTok API limit is 20

        // Use TikTok API v2 only (v1 is deprecated)
        // According to TikTok API v2 documentation
        // fields should be a comma-separated string in query parameters
        // Note: embed_url and video_status are invalid fields, removed
        const fieldsString = 'id,title,cover_image_url,duration,view_count,like_count,comment_count,share_count,create_time';

        const videosResp = await axios.post(
            'https://open.tiktokapis.com/v2/video/list/',
            {
                max_count: maxCount,
                cursor: parseInt(req.query.cursor) || 0
            },
            {
                headers: {
                    Authorization: `Bearer ${tiktok.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    fields: fieldsString
                }
            }
        );

        // TikTok API v2 response structure
        const videos = videosResp.data?.data?.videos || [];
        console.log('✅ TikTok API v2: got', videos.length, 'videos');
        const processedVideos = videos.map(video => ({
            id: video.id,
            title: video.title || video.video_description || 'Untitled',
            coverImageUrl: video.cover_image_url,
            embedUrl: video.embed_url || video.embed_link || video.embed_html || null,
            duration: video.duration,
            viewCount: video.view_count || 0,
            likeCount: video.like_count || 0,
            commentCount: video.comment_count || 0,
            shareCount: video.share_count || 0,
            createTime: video.create_time,
            shareUrl: video.share_url || null,
        }));

        return res.json({
            success: true,
            videos: processedVideos,
            count: processedVideos.length,
            cursor: videosResp.data?.data?.cursor || null,
            has_more: videosResp.data?.data?.has_more || false
        });
    } catch (error) {
        console.error('❌ TikTok videos error:', error);

        const errorData = error?.response?.data || {};
        const errorStatus = error?.response?.status;

        // Log detailed error information
        if (errorData.error) {
            console.error('📋 TikTok API Error Details:', {
                error_code: errorData.error?.code || errorData.error?.error_code,
                error_msg: errorData.error?.message || errorData.error?.error_msg,
                log_id: errorData.error?.log_id,
                description: errorData.error?.description
            });
        }

        // Handle 403 - Permission denied or deprecated API
        if (errorStatus === 403) {
            console.error('⚠️ TikTok API returned 403 Forbidden');
            console.error('Full error response:', JSON.stringify(errorData, null, 2));

            // Try to get tiktok info if available
            let scopeInfo = null;
            let hasVideoScope = false;
            try {
                if (tiktok) {
                    scopeInfo = tiktok.scope || null;
                    hasVideoScope = tiktok.scope?.includes('video.list') || false;
                }
            } catch (e) {
                // Ignore if we can't access tiktok
            }

            const errorMsg = errorData.error?.message || errorData.error?.error_msg || errorData.error?.description || 'Access denied';
            const errorCode = errorData.error?.code || errorData.error?.error_code;

            return res.status(403).json({
                success: false,
                message: `TikTok API access denied: ${errorMsg}`,
                error: errorData.error || errorData,
                error_code: errorCode,
                error_msg: errorMsg,
                scope_granted: scopeInfo,
                has_video_list_scope: hasVideoScope,
                suggestion: errorCode === 6007137
                    ? 'TikTok API v1 is deprecated. This endpoint now uses v2 only.'
                    : 'The user may need to reconnect their TikTok account to grant the video.list permission, or the app may need additional permissions in TikTok Developer Portal'
            });
        }

        // Handle 404 - Endpoint not found
        if (errorStatus === 404) {
            console.error('⚠️ TikTok video.list API endpoint returned 404');
            console.error('Response:', errorData);

            return res.status(404).json({
                success: false,
                message: 'TikTok video.list endpoint not available. The API endpoint may have changed or the scope may not have permission.',
                error: errorData || 'Unsupported path',
                suggestion: 'Please check TikTok API documentation for the correct video.list endpoint'
            });
        }

        return res.status(errorStatus || 500).json({
            success: false,
            message: 'Failed to get TikTok videos',
            error: errorData.error || errorData,
            status: errorStatus,
        });
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

// GET /api/integrations/tiktok/challenges - Get TikTok challenges (also accessible at /api/tiktok/challenges)
router.get('/tiktok/challenges', auth, async (req, res) => {
    try {
        const { limit = 10, sort = 'trending', includeJoined = false } = req.query;

        // TODO: Implement actual TikTok challenges API integration
        // For now, return mock/placeholder data
        const challenges = [
            {
                _id: 'challenge1',
                title: 'TikTok Hashtag Challenge',
                description: 'สร้างวิดีโอด้วยแฮชแท็ก #ThaiQuestifyChallenge',
                hashtag: 'ThaiQuestifyChallenge',
                creator: {
                    name: 'ทีมงานไทยเควส',
                    avatarColor: '#EE1D52'
                },
                participants: 0,
                completed: 0,
                isJoined: includeJoined === 'true' ? false : undefined,
                points: 100,
                deadline: null
            }
        ];

        return res.json({
            success: true,
            data: {
                challenges: challenges.slice(0, parseInt(limit)),
                count: challenges.length
            }
        });
    } catch (error) {
        console.error('❌ TikTok challenges error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get TikTok challenges',
            error: error.message
        });
    }
});

// POST /api/integrations/tiktok/challenges/:challengeId/join - Join a TikTok challenge (also accessible at /api/tiktok/challenges/:challengeId/join)
router.post('/tiktok/challenges/:challengeId/join', auth, async (req, res) => {
    try {
        const { challengeId } = req.params;

        // TODO: Implement actual TikTok challenge join logic
        // For now, return success response
        return res.json({
            success: true,
            message: 'Joined TikTok challenge successfully',
            data: {
                challengeId,
                joinedAt: new Date()
            }
        });
    } catch (error) {
        console.error('❌ TikTok challenge join error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to join TikTok challenge',
            error: error.message
        });
    }
});

// ---------------------------------------
// Facebook Integration (Connect for Quests)
// ---------------------------------------

// GET /api/integrations/facebook/status
router.get('/facebook/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const facebook = user?.integrations?.facebook;

        console.log('🔍 [DEBUG] Facebook Status - Raw data from DB:', {
            userId: req.user.id,
            hasUser: !!user,
            hasFacebook: !!facebook,
            facebookRaw: JSON.stringify(facebook, null, 2),
        });

        const connected = !!(facebook?.connectedAt && facebook?.userId);
        // Use saved profileUrl (which may be public profile URL) or fallback to profile.php?id format
        const profileUrl = facebook?.profileUrl || (facebook?.userId ? `https://www.facebook.com/profile.php?id=${facebook.userId}` : null);

        // Return saved stats if available
        const stats = facebook?.stats || null;

        const responseData = {
            success: true,
            connected,
            userId: facebook?.userId || null,
            name: facebook?.name || null,
            email: facebook?.email || null,
            profileUrl,
            lastSynced: facebook?.connectedAt || null,
            stats: stats,
            lastStatsUpdate: facebook?.lastStatsUpdate || null,
        };

        console.log('📤 [DEBUG] Facebook Status - Response being sent:', JSON.stringify(responseData, null, 2));

        return res.json(responseData);
    } catch (error) {
        console.error('❌ Facebook status error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get Facebook status' });
    }
});

// POST /api/integrations/facebook/start
router.post('/facebook/start', auth, async (req, res) => {
    try {
        if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET is not configured',
            });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
        const state = jwt.sign(
            { purpose: 'facebook_connect', userId: req.user.id },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Request permissions for basic profile info and user posts
        // Note: user_posts requires App Review from Facebook for production use
        // For testing, we include it but it may not work until App Review is approved
        const scope = 'public_profile,email,user_posts'; // Added user_posts for testing

        // Remove auth_type=reauthenticate to avoid password prompt and errors
        // This allows users to connect without re-entering password
        // Users can still select account if multiple accounts are logged in
        const url =
            `https://www.facebook.com/v18.0/dialog/oauth` +
            `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
            `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${encodeURIComponent(state)}` +
            `&display=popup`; // Use popup display for better UX

        return res.json({ success: true, url });
    } catch (error) {
        console.error('❌ Facebook start error:', error);
        return res.status(500).json({ success: false, message: 'Failed to start Facebook connection' });
    }
});

// GET /api/integrations/facebook/stats - Get Facebook stats
router.get('/facebook/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const facebook = user?.integrations?.facebook;

        if (!facebook?.connectedAt || !facebook?.userId) {
            return res.status(400).json({
                success: false,
                message: 'Facebook account not connected',
            });
        }

        if (!facebook?.accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Facebook access token not available',
            });
        }

        // Fetch stats from Facebook Graph API
        // Note: With public_profile permission, limited stats are available
        // Facebook Graph API v2.0+ has restrictions on friends data
        let stats = null;
        try {
            // Try to get user info with fields that might be available
            const userInfoResp = await axios.get(
                `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${encodeURIComponent(facebook.accessToken)}`
            );

            let friendsCount = null;

            // Attempt to get friends count (Note: user_friends permission is deprecated)
            // This will only work if the app has been granted friends permission
            // and will only return friends who also use the app
            try {
                const friendsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/me/friends?summary=true&access_token=${encodeURIComponent(facebook.accessToken)}`
                );
                friendsCount = friendsResp.data?.summary?.total_count || null;
            } catch (friendsError) {
                // Friends API might not be available due to permission restrictions
                console.log('⚠️ Facebook friends count not available:', friendsError?.response?.data?.error?.message || friendsError?.message);
            }

            // Note: subscribers/following API is deprecated in v2.0+ and cannot be used
            // Facebook Graph API v2.0+ removed user_subscriptions permission

            stats = {
                userId: userInfoResp.data?.id || facebook.userId,
                name: userInfoResp.data?.name || facebook.name,
                friendsCount: friendsCount,
                updatedAt: new Date(),
            };

            // Save stats to database
            if (user) {
                user.integrations.facebook.lastStatsUpdate = new Date();
                user.integrations.facebook.stats = stats;
                await user.save();
            }
        } catch (statsError) {
            console.log('⚠️ Facebook stats fetch failed:', statsError?.message || statsError);
            // Use saved stats if fetch fails
            if (facebook?.stats) {
                stats = facebook.stats;
            } else {
                // Return basic stats from stored data
                stats = {
                    userId: facebook.userId,
                    name: facebook.name,
                    friendsCount: null,
                    updatedAt: facebook.connectedAt || new Date(),
                };
            }
        }

        return res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('❌ Facebook stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get Facebook stats',
            error: error?.response?.data || error?.message,
        });
    }
});

// POST /api/integrations/facebook/disconnect
router.post('/facebook/disconnect', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                'integrations.facebook.connectedAt': null,
                'integrations.facebook.userId': null,
                'integrations.facebook.name': null,
                'integrations.facebook.email': null,
                'integrations.facebook.avatarUrl': null,
                'integrations.facebook.profileUrl': null,
                'integrations.facebook.accessToken': null,
                'integrations.facebook.expiresAt': null,
                'integrations.facebook.scope': null,
                'integrations.facebook.stats': null,
                'integrations.facebook.lastStatsUpdate': null,
            },
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Facebook disconnect error:', error);
        return res.status(500).json({ success: false, message: 'Failed to disconnect Facebook' });
    }
});

// POST /api/integrations/facebook/verify-engagement
// Verify Facebook engagement (post with location, like, share, comment)
router.post('/facebook/verify-engagement', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('integrations');
        const facebook = user?.integrations?.facebook;

        if (!facebook?.connectedAt || !facebook?.userId) {
            return res.status(400).json({
                success: false,
                message: 'Facebook account not connected',
            });
        }

        if (!facebook?.accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Facebook access token not available',
            });
        }

        const { type, postId, locationCoordinates, targetLocation, radius } = req.body;

        // Validate input
        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Engagement type is required (checkin, like, share, comment, hashtag, page_post)',
            });
        }

        let verificationResult = {
            verified: false,
            message: '',
            data: null,
        };

        try {
            if (type === 'checkin') {
                // Verify check-in post with location
                if (!postId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Post ID is required for check-in verification',
                    });
                }

                // Get post details including location
                const postResp = await axios.get(
                    `https://graph.facebook.com/v18.0/${postId}?fields=id,message,place,created_time,location&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const post = postResp.data;
                const postLocation = post.place?.location || post.location;

                if (!postLocation) {
                    verificationResult = {
                        verified: false,
                        message: 'Post does not contain location information',
                        data: { post },
                    };
                } else if (targetLocation && radius) {
                    // Verify location distance if target location is provided
                    const locationVerificationService = require('../service/locationVerificationService');

                    const postCoords = {
                        latitude: parseFloat(postLocation.latitude),
                        longitude: parseFloat(postLocation.longitude),
                    };

                    const targetCoords = typeof targetLocation === 'string'
                        ? (() => {
                            const [lat, lng] = targetLocation.split(',').map(Number);
                            return { latitude: lat, longitude: lng };
                        })()
                        : targetLocation;

                    const locationCheck = await locationVerificationService.verifyLocation(
                        postCoords,
                        targetCoords,
                        radius
                    );

                    verificationResult = {
                        verified: locationCheck.isValid,
                        message: locationCheck.isValid
                            ? `Check-in verified (distance: ${locationCheck.distance.toFixed(0)}m)`
                            : `Post location is too far (${locationCheck.distance.toFixed(0)}m, required: ${radius}m)`,
                        data: {
                            post,
                            location: postLocation,
                            distance: locationCheck.distance,
                            withinRadius: locationCheck.isValid,
                        },
                    };
                } else {
                    // Just verify that post has location
                    verificationResult = {
                        verified: true,
                        message: 'Check-in post verified (location present)',
                        data: {
                            post,
                            location: postLocation,
                        },
                    };
                }
            } else if (type === 'like') {
                // Verify like on a post/page
                if (!postId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Post/Page ID is required for like verification',
                    });
                }

                // Check if user liked the post
                const likesResp = await axios.get(
                    `https://graph.facebook.com/v18.0/${postId}/likes?limit=1000&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const likes = likesResp.data?.data || [];
                const userLiked = likes.some(like => like.id === facebook.userId);

                verificationResult = {
                    verified: userLiked,
                    message: userLiked
                        ? 'Like verified'
                        : 'User has not liked this post/page',
                    data: {
                        postId,
                        userLiked,
                        likesCount: likes.length,
                    },
                };
            } else if (type === 'share') {
                // Verify share (check user's posts for shared content)
                if (!postId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Post ID is required for share verification',
                    });
                }

                // Get user's posts and check for shares
                const postsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/me/posts?fields=id,message,shares,link&limit=100&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const userPosts = postsResp.data?.data || [];
                // Check if any post shares the target post
                const sharedPost = userPosts.find(post =>
                    post.link && post.link.includes(postId)
                );

                verificationResult = {
                    verified: !!sharedPost,
                    message: sharedPost
                        ? 'Share verified'
                        : 'User has not shared this post',
                    data: {
                        postId,
                        sharedPost: sharedPost || null,
                    },
                };
            } else if (type === 'comment') {
                // Verify comment on a post
                if (!postId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Post ID is required for comment verification',
                    });
                }

                // Get comments on the post
                const commentsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/${postId}/comments?limit=1000&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const comments = commentsResp.data?.data || [];
                const userComment = comments.find(comment => comment.from?.id === facebook.userId);

                verificationResult = {
                    verified: !!userComment,
                    message: userComment
                        ? 'Comment verified'
                        : 'User has not commented on this post',
                    data: {
                        postId,
                        comment: userComment || null,
                        commentsCount: comments.length,
                    },
                };
            } else if (type === 'hashtag') {
                // Verify user posted with specific hashtag
                const { hashtag, timeRange } = req.body;

                if (!hashtag) {
                    return res.status(400).json({
                        success: false,
                        message: 'Hashtag is required for hashtag verification',
                    });
                }

                // Get user's posts
                const limit = timeRange ? 500 : 100; // Get more posts if checking time range
                const postsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,permalink_url&limit=${limit}&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const userPosts = postsResp.data?.data || [];
                const hashtagLower = hashtag.toLowerCase().replace('#', '').trim();

                // Find posts with hashtag
                const matchingPosts = userPosts.filter(post => {
                    const message = (post.message || '').toLowerCase();
                    // Check for hashtag (with # or without)
                    const hasHashtag = message.includes(`#${hashtagLower}`) ||
                        message.split(/\s+/).some(word => word === `#${hashtagLower}` || word === hashtagLower);

                    // Check time range if specified (in hours)
                    if (hasHashtag && timeRange) {
                        const postTime = new Date(post.created_time);
                        const now = new Date();
                        const hoursAgo = (now - postTime) / (1000 * 60 * 60);
                        return hoursAgo <= timeRange;
                    }

                    return hasHashtag;
                });

                const latestMatchingPost = matchingPosts.length > 0 ? matchingPosts[0] : null;

                verificationResult = {
                    verified: !!latestMatchingPost,
                    message: latestMatchingPost
                        ? `Post with hashtag #${hashtag} verified (found ${matchingPosts.length} post(s))`
                        : `User has not posted with hashtag #${hashtag}`,
                    data: {
                        post: latestMatchingPost,
                        hashtag: hashtag,
                        matchingPostsCount: matchingPosts.length,
                        allMatchingPosts: matchingPosts.slice(0, 10), // Return up to 10 matching posts
                    },
                };
            } else if (type === 'page_post' || type === 'page_tag') {
                // Verify user posted on page or tagged page
                const { pageId, pageUsername, pageUrl } = req.body;

                // Extract page ID or username from URL if provided
                let targetPage = pageId || pageUsername;
                if (pageUrl && !targetPage) {
                    // Extract from URL like https://www.facebook.com/thaiquestify/
                    const urlMatch = pageUrl.match(/facebook\.com\/([^\/\?]+)/);
                    if (urlMatch) {
                        targetPage = urlMatch[1];
                    }
                }

                if (!targetPage) {
                    return res.status(400).json({
                        success: false,
                        message: 'Page ID, pageUsername, or pageUrl is required for page_post verification',
                    });
                }

                // Get page info
                let pageInfo = null;
                try {
                    const pageResp = await axios.get(
                        `https://graph.facebook.com/v18.0/${targetPage}?fields=id,name,username&access_token=${encodeURIComponent(facebook.accessToken)}`
                    );
                    pageInfo = pageResp.data;
                    targetPage = pageInfo.id; // Use page ID for consistency
                } catch (pageError) {
                    console.log('⚠️ Could not fetch page info:', pageError?.response?.data || pageError.message);
                    // Continue with provided pageId/username
                }

                // Get user's posts and check if they mention/tag the page
                const postsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,permalink_url&limit=100&access_token=${encodeURIComponent(facebook.accessToken)}`
                );

                const userPosts = postsResp.data?.data || [];

                // Check if user has posts mentioning the page (by username or page name)
                const pageName = pageInfo?.name?.toLowerCase() || targetPage.toLowerCase();
                const pageUsernameLower = pageInfo?.username?.toLowerCase() || targetPage.toLowerCase();

                const matchingPosts = userPosts.filter(post => {
                    const message = (post.message || '').toLowerCase();
                    // Check if post mentions page name, username, or page URL
                    return message.includes(pageName) ||
                        message.includes(pageUsernameLower) ||
                        message.includes(`@${pageUsernameLower}`) ||
                        message.includes('facebook.com/' + pageUsernameLower);
                });

                const latestMatchingPost = matchingPosts.length > 0 ? matchingPosts[0] : null;

                verificationResult = {
                    verified: !!latestMatchingPost,
                    message: latestMatchingPost
                        ? `Post mentioning/tagging page verified (found ${matchingPosts.length} post(s))`
                        : `User has not posted mentioning/tagging this page`,
                    data: {
                        post: latestMatchingPost,
                        pageId: targetPage,
                        pageInfo: pageInfo,
                        matchingPostsCount: matchingPosts.length,
                        allMatchingPosts: matchingPosts.slice(0, 10),
                    },
                };
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid engagement type. Use: checkin, like, share, comment, hashtag, or page_post',
                });
            }

            return res.json({
                success: true,
                ...verificationResult,
            });
        } catch (apiError) {
            console.error('❌ Facebook API error:', apiError?.response?.data || apiError);

            const errorData = apiError?.response?.data?.error || {};
            const errorCode = errorData.code;
            const errorMessage = errorData.message || apiError.message;

            // Handle permission errors
            if (errorCode === 200 || errorMessage?.includes('permission')) {
                return res.status(403).json({
                    success: false,
                    message: 'Facebook permission required. Please reconnect Facebook with user_posts permission.',
                    error: errorMessage,
                    suggestion: 'This feature requires user_posts permission which may need Facebook App Review',
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to verify Facebook engagement',
                error: errorMessage,
            });
        }
    } catch (error) {
        console.error('❌ Facebook engagement verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify Facebook engagement',
            error: error.message,
        });
    }
});

// Test endpoint to verify user_posts permission and fetch posts
// Can be accessed with user ID as query parameter for testing without auth
router.get('/facebook/test-posts', async (req, res) => {
    try {
        // Support both authenticated (JWT) and query parameter (for testing)
        let userId = null;

        // Try to get user from auth token first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id || decoded.userId;
            } catch (tokenError) {
                // Token invalid, continue to query parameter method
                console.log('⚠️ [TEST] JWT token invalid, trying query parameter method');
            }
        }

        // Fallback: get user ID from query parameter (for testing without auth)
        if (!userId && req.query.userId) {
            userId = req.query.userId;
        }

        // Also support Facebook User ID for direct testing
        const facebookUserIdParam = req.query.facebookUserId;

        if (!userId && !facebookUserIdParam) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide JWT token, MongoDB userId, or Facebook userId.',
                usage: {
                    method1: 'Authorization: Bearer YOUR_JWT_TOKEN',
                    method2: '?userId=MONGODB_USER_ID (MongoDB ObjectId)',
                    method3: '?facebookUserId=FACEBOOK_USER_ID (Facebook User ID)'
                }
            });
        }

        let user = null;

        // If Facebook User ID provided, find user by Facebook integration
        if (facebookUserIdParam) {
            user = await User.findOne({
                'integrations.facebook.userId': facebookUserIdParam
            }).select('integrations');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User not found with Facebook User ID: ${facebookUserIdParam}`,
                    suggestion: 'Make sure the user has connected Facebook in the app'
                });
            }
        } else {
            // Try to find by MongoDB User ID
            try {
                user = await User.findById(userId).select('integrations');
            } catch (idError) {
                // If userId is not a valid MongoDB ObjectId, try to find by Facebook User ID
                user = await User.findOne({
                    'integrations.facebook.userId': userId
                }).select('integrations');
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User not found with ID: ${userId}`,
                    suggestion: 'Try using ?facebookUserId=YOUR_FACEBOOK_USER_ID instead'
                });
            }
        }

        const facebook = user?.integrations?.facebook;

        if (!facebook?.connectedAt || !facebook?.accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Facebook not connected. Please connect Facebook first.'
            });
        }

        const accessToken = facebook.accessToken;
        const facebookUserId = facebook.userId;

        console.log('🔔 [TEST] Testing user_posts permission...');
        console.log('   User ID:', userId);
        console.log('   Facebook User ID:', facebookUserId);
        console.log('   Has Access Token:', !!accessToken);

        // Step 1: Check token info and permissions
        let tokenInfo = null;
        try {
            const tokenResp = await axios.get(
                `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
            );
            tokenInfo = tokenResp.data?.data;
            console.log('✅ [TEST] Token info:', {
                isValid: tokenInfo?.is_valid,
                userId: tokenInfo?.user_id,
                scopes: tokenInfo?.scopes || tokenInfo?.granted_scopes,
                expiresAt: tokenInfo?.expires_at,
            });
        } catch (tokenError) {
            console.error('❌ [TEST] Error checking token:', tokenError?.response?.data || tokenError?.message);
        }

        const hasUserPostsScope = (tokenInfo?.scopes || tokenInfo?.granted_scopes || []).includes('user_posts');
        console.log('   Has user_posts permission:', hasUserPostsScope);

        // Step 2: Try to fetch user posts
        let posts = [];
        let postsError = null;

        try {
            // Try {user-id}/posts endpoint first
            const postsResp = await axios.get(
                `https://graph.facebook.com/v18.0/${facebookUserId}/posts`,
                {
                    params: {
                        fields: 'id,message,place,created_time',
                        limit: 10,
                        access_token: accessToken
                    }
                }
            );
            posts = postsResp.data?.data || [];
            console.log('✅ [TEST] Successfully fetched posts via {user-id}/posts');
            console.log('   Total posts:', posts.length);
        } catch (postsError1) {
            console.error('❌ [TEST] Error with {user-id}/posts:', postsError1?.response?.data || postsError1?.message);

            // Try me/posts as fallback
            try {
                const mePostsResp = await axios.get(
                    `https://graph.facebook.com/v18.0/me/posts`,
                    {
                        params: {
                            fields: 'id,message,place,created_time',
                            limit: 10,
                            access_token: accessToken
                        }
                    }
                );
                posts = mePostsResp.data?.data || [];
                console.log('✅ [TEST] Successfully fetched posts via me/posts');
                console.log('   Total posts:', posts.length);
            } catch (postsError2) {
                console.error('❌ [TEST] Error with me/posts:', postsError2?.response?.data || postsError2?.message);
                postsError = postsError2?.response?.data || { message: postsError2?.message };
            }
        }

        // Step 3: Try to fetch feed as alternative
        let feed = [];
        let feedError = null;

        try {
            const feedResp = await axios.get(
                `https://graph.facebook.com/v18.0/${facebookUserId}/feed`,
                {
                    params: {
                        fields: 'id,message,place,created_time',
                        limit: 10,
                        access_token: accessToken
                    }
                }
            );
            feed = feedResp.data?.data || [];
            console.log('✅ [TEST] Successfully fetched feed');
            console.log('   Total feed items:', feed.length);
        } catch (feedErr) {
            console.error('❌ [TEST] Error fetching feed:', feedErr?.response?.data || feedErr?.message);
            feedError = feedErr?.response?.data || { message: feedErr?.message };
        }

        // Return test results
        return res.json({
            success: true,
            test: 'user_posts permission',
            tokenInfo: {
                isValid: tokenInfo?.is_valid,
                userId: tokenInfo?.user_id,
                scopes: tokenInfo?.scopes || tokenInfo?.granted_scopes || [],
                hasUserPostsScope: hasUserPostsScope,
                expiresAt: tokenInfo?.expires_at,
            },
            posts: {
                success: posts.length > 0 || !postsError,
                count: posts.length,
                sample: posts.slice(0, 3).map(p => ({
                    id: p.id,
                    message: p.message?.substring(0, 100) || '(no message)',
                    hasPlace: !!p.place,
                    placeName: p.place?.name,
                    createdTime: p.created_time,
                })),
                error: postsError,
            },
            feed: {
                success: feed.length > 0 || !feedError,
                count: feed.length,
                sample: feed.slice(0, 3).map(f => ({
                    id: f.id,
                    message: f.message?.substring(0, 100) || '(no message)',
                    hasPlace: !!f.place,
                    placeName: f.place?.name,
                    createdTime: f.created_time,
                })),
                error: feedError,
            },
            recommendations: {
                canUsePosts: hasUserPostsScope && posts.length > 0,
                canUseFeed: hasUserPostsScope && feed.length > 0,
                needsAppReview: !hasUserPostsScope,
                message: hasUserPostsScope
                    ? (posts.length > 0 || feed.length > 0
                        ? '✅ user_posts permission is working!'
                        : '⚠️ Permission granted but no posts found. User may not have any posts.')
                    : '❌ user_posts permission not granted. May need to reconnect Facebook or request App Review.',
            }
        });
    } catch (error) {
        console.error('❌ [TEST] Error testing user_posts:', error);
        return res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error?.response?.data || error?.message
        });
    }
});

module.exports = router;