// models/JobApplication.js
const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  // เลขที่ใบสมัคร (อ้างอิง) APP{YYYYMMDD}{sequence}
  applicationNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true,
  },
  // งานที่สมัคร
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job', // Changed from 'UserGeneratedQuest' to 'Job'
    required: true,
    index: true
  },

  // คนรับงาน (ผู้สมัคร)
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // คนจ้างงาน (เจ้าของงาน)
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // สถานะการสมัคร
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },

  // ข้อความจากผู้สมัคร (optional)
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },

  // วันที่ยอมรับงาน
  acceptedAt: {
    type: Date,
    default: null
  },

  // วันที่จบงาน
  completedAt: {
    type: Date,
    default: null
  },

  // ข้อมูลการจ่ายเงิน
  payment: {
    jobAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    commissionFee: {
      type: Number,
      default: 0,
      min: 0
    },
    workerReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    paidAt: {
      type: Date,
      default: null
    }
  },

  // วันที่สมัคร
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
jobApplicationSchema.index({ job: 1, worker: 1 }, { unique: true }); // Prevent duplicate applications
jobApplicationSchema.index({ worker: 1, status: 1 });
jobApplicationSchema.index({ employer: 1, status: 1 });
jobApplicationSchema.index({ status: 1, appliedAt: -1 });

// Generate application number (run first)
jobApplicationSchema.pre('save', async function (next) {
  if (this.isNew && !this.applicationNumber) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const count = await mongoose.model('JobApplication').countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      });
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const seq = String(count + 1).padStart(6, '0');
      this.applicationNumber = `APP${y}${m}${d}${seq}`;
    } catch (e) {
      console.error('Error generating application number:', e);
      this.applicationNumber = `APP${Date.now().toString().slice(-10)}`;
    }
  }
  next();
});

// Prevent applying to same job twice
jobApplicationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.model('JobApplication').findOne({
      job: this.job,
      worker: this.worker,
    });
    if (existing) {
      return next(new Error('คุณได้สมัครงานนี้แล้ว'));
    }
  }
  next();
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
