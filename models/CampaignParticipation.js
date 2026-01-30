// backend/models/CampaignParticipation.js - การเข้าร่วมแคมเปญส่งเสริมการขาย
const mongoose = require('mongoose');

const campaignParticipationSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['joined', 'completed'],
    default: 'joined'
  },

  completedAt: { type: Date },
  pointsAwarded: { type: Number, default: 0 },

  // สำหรับ daily: วันที่ทำครบล่าสุด และจำนวนครั้งที่ทำครบ
  lastCompletedDate: { type: Date },
  completionCount: { type: Number, default: 0 },
}, { timestamps: true });

campaignParticipationSchema.index({ campaign: 1, user: 1 }, { unique: true });
campaignParticipationSchema.index({ campaign: 1, status: 1 });
campaignParticipationSchema.index({ user: 1 });

module.exports = mongoose.model('CampaignParticipation', campaignParticipationSchema);
