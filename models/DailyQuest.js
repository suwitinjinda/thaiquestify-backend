const mongoose = require('mongoose');

const dailyQuestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },

    // Quest Configuration
    questType: {
        type: String,
        enum: ['checkin', 'explore', 'complete', 'share', 'rate', 'social'],
        required: true
    },

    points: {
        type: Number,
        required: true,
        min: 1
    },

    icon: {
        type: String,
        default: ''
    },

    requirements: {
        type: String,
        required: true
    },

    // Quest Logic
    action: {
        type: String,
        required: true,
        enum: ['app_open', 'quest_view', 'quest_complete', 'share_social', 'rate_shop', 'invite_friend']
    },

    actionCount: {
        type: Number,
        default: 1
    },

    // Timing & Availability
    availableDays: {
        type: [String], // ['monday', 'tuesday', ...]
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },

    startTime: {
        type: String,
        default: '00:00'
    },

    endTime: {
        type: String,
        default: '23:59'
    },

    // Status & Ordering
    isActive: {
        type: Boolean,
        default: true
    },

    displayOrder: {
        type: Number,
        default: 0
    },

    // Statistics
    totalCompletions: {
        type: Number,
        default: 0
    },

    totalPointsGiven: {
        type: Number,
        default: 0
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// เพิ่ม method สำหรับฟีเจอร์ใหม่
dailyQuestSchema.statics.getTodaysQuests = function () {
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];

    return this.find({
        isActive: true,
        availableDays: todayName
    }).sort({ displayOrder: 1 });
};

dailyQuestSchema.methods.isAvailableNow = function () {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');

    return currentTime >= this.startTime && currentTime <= this.endTime;
};

module.exports = mongoose.model('DailyQuest', dailyQuestSchema);