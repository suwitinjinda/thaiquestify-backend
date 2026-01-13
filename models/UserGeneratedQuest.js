// models/UserGeneratedQuest.js
const mongoose = require('mongoose');

const userGeneratedQuestSchema = new mongoose.Schema({
    // ผู้สร้าง quest
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ข้อมูล quest
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },

    // ประเภท quest
    type: {
        type: String,
        enum: [
            'facebook_follow',    // ติดตาม Facebook
            'facebook_like',      // Like โพสต์/เพจ
            'facebook_share',     // แชร์โพสต์
            'instagram_follow',   // ติดตาม Instagram
            'tiktok_follow',      // ติดตาม TikTok
            'line_add',           // เพิ่ม LINE
            'website_visit',      // เข้าชมเว็บไซต์
            'app_download',       // ดาวน์โหลดแอป
            'form_submit',        // กรอกแบบฟอร์ม
            'video_watch'         // ดูวิดีโอ
        ],
        required: true
    },

    // Platform ที่เกี่ยวข้อง
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'tiktok', 'line', 'website', 'app', 'all'],
        required: true
    },

    // เป้าหมาย
    target: {
        type: Number,
        required: true,
        min: 1,
        max: 1000  // จำกัดสูงสุด
    },

    // Link เป้าหมาย (ถ้ามี)
    targetUrl: {
        type: String,
        default: ''
    },

    // รายละเอียดเพิ่มเติม
    details: {
        facebookPageId: String,    // สำหรับ Facebook Like quest
        postId: String,            // ID โพสต์
        videoUrl: String,          // URL วิดีโอ
        formId: String,            // ID ฟอร์ม
        appStoreUrl: String,       // ลิงก์ App Store
        playStoreUrl: String       // ลิงก์ Play Store
    },

    // รางวัลสำหรับผู้ทำ quest
    reward: {
        points: {
            type: Number,
            required: true,
            min: 1,
            max: 1000
        },
        coins: {
            type: Number,
            default: 0,
            min: 0
        },
        customReward: String      // รางวัลพิเศษ (ถ้ามี)
    },

    // รางวัลสำหรับผู้สร้าง quest (เมื่อ quest สำเร็จ)
    creatorReward: {
        points: {
            type: Number,
            default: 0
        },
        coins: {
            type: Number,
            default: 0
        }
    },

    // การตั้งค่า quest
    settings: {
        isPublic: {
            type: Boolean,
            default: true
        },
        maxParticipants: {
            type: Number,
            default: 100,
            min: 1,
            max: 1000
        },
        durationDays: {
            type: Number,
            default: 7,  // จำนวนวันที่ quest เปิดรับ
            min: 1,
            max: 30
        },
        requireVerification: {
            type: Boolean,
            default: true
        }
    },

    // สถิติ
    stats: {
        totalParticipants: { type: Number, default: 0 },
        completedCount: { type: Number, default: 0 },
        currentCount: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    },

    // สถานะ
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'paused', 'completed', 'expired', 'rejected'],
        default: 'draft'
    },

    // การตรวจสอบ
    verificationMethod: {
        type: String,
        enum: ['auto', 'manual', 'screenshot', 'link_click', 'none'],
        default: 'auto'
    },

    // วันเวลาต่างๆ
    createdAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    startedAt: { type: Date },
    expiredAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true });

// Indexes สำหรับค้นหาที่รวดเร็ว
userGeneratedQuestSchema.index({ creator: 1, status: 1 });
userGeneratedQuestSchema.index({ status: 1, createdAt: -1 });
userGeneratedQuestSchema.index({ type: 1, platform: 1 });
userGeneratedQuestSchema.index({ 'stats.currentCount': -1 }); // สำหรับ popular quests

// Collection name: 'jobpostings' - สำหรับงาน/รับจ้าง (job postings)
// แยกจาก socialquests (เควสจากชุมชน)
module.exports = mongoose.model('UserGeneratedQuest', userGeneratedQuestSchema, 'jobpostings');