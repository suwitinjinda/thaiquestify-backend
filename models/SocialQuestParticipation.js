const mongoose = require('mongoose');

const socialQuestParticipationSchema = new mongoose.Schema({
  // Quest reference
  quest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialQuest',
    required: true,
    index: true
  },

  // Participant (user who does the quest)
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Participation status
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Verification information
  verification: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Admin who verified
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationNote: {
      type: String,
      default: ''
    },
    proofUrl: {
      type: String,
      default: '' // Screenshot or proof link
    },
    commentLink: {
      type: String,
      default: '' // Link to TikTok comment (for comment quests)
    }
  },

  // Points information
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsAwardedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Unique index: one user can only participate once per quest
socialQuestParticipationSchema.index({ quest: 1, participant: 1 }, { unique: true });

// Index for admin queries
socialQuestParticipationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SocialQuestParticipation', socialQuestParticipationSchema);
