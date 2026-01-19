const mongoose = require('mongoose');

// Job - ระบบจ้างงาน
const jobSchema = new mongoose.Schema({
  jobNumber: {
    type: String,
    required: false, // Will be generated in pre-save hook
    unique: true,
    sparse: true,
    index: true,
  },
  // ผู้จ้างงาน (ร้านค้าหรือผู้ใช้)
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // ร้านค้าที่เกี่ยวข้อง (ถ้ามี)
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null,
    index: true,
  },
  // ชื่องาน
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  // รายละเอียดงาน
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  // ประเภทงาน
  category: {
    type: String,
    enum: ['delivery', 'kitchen', 'service', 'sales', 'handyman', 'agriculture', 'other'],
    required: true,
    index: true,
  },
  // สถานที่ทำงาน
  location: {
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      default: '',
    },
    province: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  // เงินเดือน/ค่าจ้าง
  salary: {
    type: {
      type: String,
      enum: ['hourly', 'daily', 'monthly', 'per_job', 'negotiable'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'THB',
    },
  },
  // วันที่เริ่มงาน
  startDate: {
    type: Date,
    required: true,
  },
  // วันที่สิ้นสุดงาน (ถ้ามี)
  endDate: {
    type: Date,
    default: null,
  },
  // เวลาทำงาน
  workHours: {
    start: {
      type: String, // Format: "HH:mm"
      default: '09:00',
    },
    end: {
      type: String, // Format: "HH:mm"
      default: '18:00',
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
  },
  // คุณสมบัติที่ต้องการ
  requirements: {
    experience: {
      type: String,
      enum: ['none', 'beginner', 'intermediate', 'advanced'],
      default: 'none',
    },
    skills: [{
      type: String,
    }],
    ageMin: {
      type: Number,
      default: null,
    },
    ageMax: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any',
    },
  },
  // สถานะงาน
  status: {
    type: String,
    enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled', 'closed'],
    default: 'open',
    index: true,
  },
  // คนรับงาน (ถ้ามี)
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  // จำนวนคนที่ต้องการ
  requiredWorkers: {
    type: Number,
    default: 1,
    min: 1,
  },
  // จำนวนคนที่รับแล้ว
  acceptedWorkers: {
    type: Number,
    default: 0,
    min: 0,
  },
  // วันที่ปิดรับสมัคร
  applicationDeadline: {
    type: Date,
    default: null,
  },
  // ข้อมูลติดต่อ
  contact: {
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
  },
}, {
  timestamps: true,
});

// Generate job number
jobSchema.pre('save', async function (next) {
  if (!this.jobNumber || this.isNew) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await mongoose.model('Job').countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const sequence = String(count + 1).padStart(6, '0');

      this.jobNumber = `JOB${year}${month}${day}${sequence}`;
    } catch (error) {
      console.error('Error generating job number:', error);
      const timestamp = Date.now().toString().slice(-10);
      this.jobNumber = `JOB${timestamp}`;
    }
  }
  next();
});

// Indexes
jobSchema.index({ employer: 1, status: 1, createdAt: -1 });
jobSchema.index({ shop: 1, status: 1 });
jobSchema.index({ worker: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ 'location.province': 1, status: 1 });
jobSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Job', jobSchema);
