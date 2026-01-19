// models/JobLog.js
const mongoose = require('mongoose');

const jobLogSchema = new mongoose.Schema({
  // ประเภทการกระทำ
  action: {
    type: String,
    enum: [
      'job_created',        // สร้างงาน
      'job_applied',        // สมัครงาน
      'job_accepted',       // ยอมรับคนทำงาน
      'job_rejected',       // ปฏิเสธการสมัคร
      'job_completed',      // จบงาน
      'job_cancelled',      // ยกเลิกงาน (โดยคนจ้างงาน)
      'payment_processed'   // จ่ายเงิน
    ],
    required: true,
    index: true
  },

  // งานที่เกี่ยวข้อง
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserGeneratedQuest',
    required: true,
    index: true
  },

  // ผู้ใช้ที่ทำการกระทำ
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ผู้ใช้ที่เกี่ยวข้อง (เช่น คนรับงาน, คนจ้างงาน)
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // การสมัครงานที่เกี่ยวข้อง (ถ้ามี)
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication',
    default: null
  },

  // ข้อมูลเพิ่มเติม
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // จำนวนเงินที่เกี่ยวข้อง (ถ้ามี)
  amount: {
    type: Number,
    default: 0
  },

  // IP Address
  ipAddress: {
    type: String,
    default: ''
  },

  // User Agent
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
jobLogSchema.index({ action: 1, createdAt: -1 });
jobLogSchema.index({ user: 1, createdAt: -1 });
jobLogSchema.index({ job: 1, createdAt: -1 });
jobLogSchema.index({ createdAt: -1 });

const JobLog = mongoose.model('JobLog', jobLogSchema);

module.exports = JobLog;
