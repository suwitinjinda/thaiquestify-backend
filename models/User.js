const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ข้อมูลพื้นฐาน (existing)
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  // Social IDs (existing)
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Social integrations (for quest verification; NOT login)
  integrations: {
    tiktok: {
      connectedAt: { type: Date, default: null },
      openId: { type: String, default: null },
      unionId: { type: String, default: null },
      username: { type: String, default: null }, // TikTok username (e.g., "noom2419")
      displayName: { type: String, default: null }, // Display name (e.g., "noom")
      avatarUrl: { type: String, default: null },

      // NOTE: In production, store tokens encrypted / in a secrets store.
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      scope: { type: String, default: null },
    },
    facebook: {
      connectedAt: { type: Date, default: null },
      userId: { type: String, default: null }, // Facebook User ID
      name: { type: String, default: null }, // Facebook display name
      email: { type: String, default: null },
      avatarUrl: { type: String, default: null },
      profileUrl: { type: String, default: null }, // Facebook profile URL

      // NOTE: In production, store tokens encrypted / in a secrets store.
      accessToken: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      scope: { type: String, default: null },
      accountType: { 
        type: String, 
        default: null,
        required: false, // Make it optional
        validate: {
          validator: function(value) {
            // Skip validation if value is null or undefined
            if (value === null || value === undefined) {
              return true; // Allow null/undefined
            }
            // Only validate if value is provided
            return ['user', 'page', 'unknown'].includes(value);
          },
          message: 'Account type must be null, user, page, or unknown'
        }
      }, // Account type: 'user' (Personal), 'page' (Page/New Pages Experience), 'unknown', or null
      stats: { type: mongoose.Schema.Types.Mixed, default: null }, // Store stats object
      lastStatsUpdate: { type: Date, default: null },
    },
  },

  // ข้อมูลการสมัคร (existing)
  signupMethod: {
    type: String,
    enum: ['facebook', 'google', 'email'],
    default: 'email'
  },
  userType: {
    type: String,
    enum: ['customer', 'shop', 'partner', 'admin'],
    default: 'customer'
  },

  // ข้อมูลส่วนตัว (existing)
  photo: { type: String, default: '' },
  phone: { type: String, default: '' },

  // การยืนยันและสถานะ (existing)
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  partnerCode: { type: String, default: null },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    default: null
  },

  // *** NEW: Points System ***
  points: {
    type: Number,
    default: 1000, // New accounts get 1000 points as starting bonus
    min: 0
  },

  // *** NEW: Streak & Quest Statistics ***
  streakStats: {
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastQuestDate: {
      type: Date,
      default: null
    },
    totalQuestsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    dailyQuestsCompletedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    awardedMilestones: {
      type: [String],
      default: []
    },
    lastResetDate: {
      type: Date,
      default: null
    }
  },

  // *** NEW: Social Quest Statistics ***
  socialStats: {
    friendsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    invitesSent: {
      type: Number,
      default: 0,
      min: 0
    },
    invitesAccepted: {
      type: Number,
      default: 0,
      min: 0
    },
    sharedQuests: {
      type: Number,
      default: 0,
      min: 0
    },
    socialPoints: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // *** NEW: Approved Followers for Follow Quest Prevention ***
  // Store TikTok usernames that have been approved for follow quests
  // This prevents creating duplicate follow quests for the same user
  approvedFollowers: [{
    tiktokUsername: {
      type: String,
      required: true,
      lowercase: true // Store in lowercase for case-insensitive comparison
    },
    approvedAt: {
      type: Date,
      default: Date.now
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialQuest'
    }
  }],

  // *** NEW: Quest History & Achievements ***
  questHistory: [{
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest'
    },
    questTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestTemplate'
    },
    questType: {
      type: String,
      enum: ['daily', 'social', 'normal', 'special']
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    streakMultiplier: {
      type: Number,
      default: 1.0
    },
    status: {
      type: String,
      enum: ['completed', 'claimed', 'expired'],
      default: 'completed'
    }
  }],

  // *** NEW: Daily Quest Progress ***
  dailyQuestProgress: {
    date: {
      type: Date,
      default: Date.now
    },
    quests: [{
      questId: String, // หรือ ObjectId ถ้ามี QuestTemplate สำหรับ daily
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      points: Number
    }],
    isStreakMaintained: {
      type: Boolean,
      default: false
    }
  },

  // *** NEW: Achievements & Badges ***
  achievements: [{
    achievementId: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date,
    points: Number
  }],

  // *** NEW: Notification Settings ***
  notificationSettings: {
    streakReminder: {
      type: Boolean,
      default: true
    },
    dailyQuestReminder: {
      type: Boolean,
      default: true
    },
    friendActivity: {
      type: Boolean,
      default: true
    },
    questExpiring: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps (existing)
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Middleware to check and reset daily streak
userSchema.pre('save', function (next) {
  if (this.isModified('streakStats.lastQuestDate') || !this.streakStats.lastQuestDate) {
    const now = new Date();
    const lastQuestDate = this.streakStats.lastQuestDate ? new Date(this.streakStats.lastQuestDate) : null;

    if (lastQuestDate) {
      const daysDiff = Math.floor((now - lastQuestDate) / (1000 * 60 * 60 * 24));

      // ถ้าเกิน 1 วัน (missed a day) รีเซ็ต streak
      if (daysDiff > 1) {
        this.streakStats.currentStreak = 0;
      }

      // ตรวจสอบว่าวันนี้รีเซ็ต daily quests แล้วหรือยัง
      const today = new Date().toDateString();
      const lastReset = this.streakStats.lastResetDate ? new Date(this.streakStats.lastResetDate).toDateString() : null;

      if (lastReset !== today) {
        this.streakStats.dailyQuestsCompletedToday = 0;
        this.streakStats.lastResetDate = now;
        this.dailyQuestProgress.date = now;
        this.dailyQuestProgress.quests = [];
        this.dailyQuestProgress.isStreakMaintained = false;
      }
    }
  }

  next();
});

// Method to check streak status
userSchema.methods.checkStreakStatus = function () {
  const now = new Date();
  const lastQuestDate = this.streakStats.lastQuestDate ? new Date(this.streakStats.lastQuestDate) : null;

  if (!lastQuestDate) {
    return {
      currentStreak: 0,
      isActiveToday: false,
      daysSinceLastQuest: null
    };
  }

  const daysDiff = Math.floor((now - lastQuestDate) / (1000 * 60 * 60 * 24));
  const isToday = lastQuestDate.toDateString() === now.toDateString();

  return {
    currentStreak: this.streakStats.currentStreak,
    longestStreak: this.streakStats.longestStreak,
    isActiveToday: isToday,
    daysSinceLastQuest: daysDiff,
    streakBroken: daysDiff > 1
  };
};

// Method to calculate streak multiplier
userSchema.methods.getStreakMultiplier = function () {
  const streak = this.streakStats.currentStreak;

  if (streak >= 30) return 2.5;
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
};

// Method to complete a daily quest
userSchema.methods.completeDailyQuest = async function (questData) {
  const today = new Date().toDateString();
  const lastQuestDate = this.streakStats.lastQuestDate ?
    new Date(this.streakStats.lastQuestDate).toDateString() : null;

  // ถ้ายังไม่เคยทำ quest วันนี้
  if (lastQuestDate !== today) {
    this.streakStats.currentStreak += 1;
    this.dailyQuestProgress.isStreakMaintained = true;

    // อัพเดต longest streak ถ้าต้องการ
    if (this.streakStats.currentStreak > this.streakStats.longestStreak) {
      this.streakStats.longestStreak = this.streakStats.currentStreak;
    }
  }

  // อัพเดต daily quest progress
  this.streakStats.dailyQuestsCompletedToday += 1;
  this.streakStats.totalQuestsCompleted += 1;

  const multiplier = this.getStreakMultiplier();
  const pointsEarned = Math.floor(questData.points * multiplier);

  this.streakStats.totalPointsEarned += pointsEarned;
  this.streakStats.lastQuestDate = new Date();

  // เพิ่มเข้า quest history
  this.questHistory.push({
    questTemplateId: questData.templateId,
    questType: 'daily',
    completedAt: new Date(),
    pointsEarned: pointsEarned,
    streakMultiplier: multiplier,
    status: 'completed'
  });

  // เพิ่มเข้า daily quest progress
  this.dailyQuestProgress.quests.push({
    questId: questData.questId,
    completed: true,
    completedAt: new Date(),
    points: pointsEarned
  });

  await this.save();

  return {
    success: true,
    pointsEarned,
    streakMultiplier: multiplier,
    newStreak: this.streakStats.currentStreak,
    isFirstQuestOfDay: lastQuestDate !== today
  };
};

// Method to get user statistics
userSchema.methods.getUserStats = function () {
  return {
    streak: {
      current: this.streakStats.currentStreak,
      longest: this.streakStats.longestStreak,
      multiplier: this.getStreakMultiplier()
    },
    quests: {
      totalCompleted: this.streakStats.totalQuestsCompleted,
      dailyCompleted: this.streakStats.dailyQuestsCompletedToday,
      totalPoints: this.streakStats.totalPointsEarned
    },
    social: {
      friends: this.socialStats.friendsCount,
      invites: this.socialStats.invitesSent,
      shared: this.socialStats.sharedQuests,
      socialPoints: this.socialStats.socialPoints
    },
    achievements: {
      count: this.achievements.length,
      totalPoints: this.achievements.reduce((sum, ach) => sum + (ach.points || 0), 0)
    }
  };
};

module.exports = mongoose.model('User', userSchema);