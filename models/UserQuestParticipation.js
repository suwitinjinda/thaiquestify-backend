// models/UserQuestParticipation.js
const mongoose = require('mongoose');

const userQuestParticipationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGeneratedQuest',
        required: true
    },

    // สถานะการเข้าร่วม
    status: {
        type: String,
        enum: ['joined', 'in_progress', 'pending_verification', 'completed', 'failed', 'cancelled'],
        default: 'joined'
    },

    // ความคืบหน้า
    progress: {
        current: { type: Number, default: 0 },
        target: { type: Number, required: true }
    },

    // ข้อมูลการยืนยัน
    verification: {
        method: String,
        screenshot: String,
        proofUrl: String,
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },

    // รางวัล
    rewardClaimed: { type: Boolean, default: false },
    rewardClaimedAt: Date,

    // ข้อมูลการติดตาม
    joinedAt: { type: Date, default: Date.now },
    completedAt: Date,

    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// Indexes
userQuestParticipationSchema.index({ user: 1, quest: 1 }, { unique: true });
userQuestParticipationSchema.index({ quest: 1, status: 1 });
userQuestParticipationSchema.index({ user: 1, status: 1 });
userQuestParticipationSchema.index({ completedAt: -1 });

module.exports = mongoose.model('UserQuestParticipation', userQuestParticipationSchema);