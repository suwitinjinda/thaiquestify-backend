const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    icon: {
        type: String,
        required: true
    },

    // Achievement Type
    type: {
        type: String,
        enum: ['streak', 'quests', 'social', 'exploration', 'special'],
        required: true
    },

    // Requirements
    requirementType: {
        type: String,
        enum: ['streak_days', 'total_quests', 'total_points', 'friends_count', 'invites_sent', 'custom'],
        required: true
    },

    requirementValue: {
        type: Number,
        required: true
    },

    // Rewards
    points: {
        type: Number,
        default: 0
    },

    badgeUrl: {
        type: String,
        default: ''
    },

    // Unlock Message
    unlockMessage: {
        type: String,
        required: true
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    isSecret: {
        type: Boolean,
        default: false
    },

    // Statistics
    unlockedCount: {
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

// Method to check if user qualifies for achievement
achievementSchema.methods.checkQualification = function (userStats) {
    switch (this.requirementType) {
        case 'streak_days':
            return userStats.streak.current >= this.requirementValue;
        case 'total_quests':
            return userStats.quests.totalCompleted >= this.requirementValue;
        case 'total_points':
            return userStats.quests.totalPoints >= this.requirementValue;
        case 'friends_count':
            return userStats.social.friends >= this.requirementValue;
        case 'invites_sent':
            return userStats.social.invites >= this.requirementValue;
        default:
            return false;
    }
};

module.exports = mongoose.model('Achievement', achievementSchema);