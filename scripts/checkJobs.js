// Script to check job status and applications
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function checkJobs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Checking all jobs...\n');
    const jobs = await Job.find({}).populate('employer', 'name email').populate('worker', 'name email');
    
    console.log(`Total jobs: ${jobs.length}\n`);
    
    jobs.forEach(job => {
      console.log(`Job: "${job.title}"`);
      console.log(`  ID: ${job._id}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Worker: ${job.worker ? (job.worker.name || job.worker) : 'none'}`);
      console.log(`  Accepted Workers: ${job.acceptedWorkers || 0}`);
      console.log(`  Employer: ${job.employer?.name || job.employer}\n`);
    });

    console.log('\n📋 Checking applications...\n');
    const apps = await JobApplication.find({ status: 'accepted' })
      .populate('worker', 'name email')
      .populate('job', 'title status');
    
    console.log(`Total accepted applications: ${apps.length}\n`);
    
    apps.forEach(app => {
      console.log(`Application ID: ${app._id}`);
      console.log(`  Job: "${app.job?.title || app.job}" (${app.job})`);
      console.log(`  Job Status: ${app.job?.status || 'unknown'}`);
      console.log(`  Worker: ${app.worker?.name || app.worker}`);
      console.log(`  Accepted At: ${app.acceptedAt || 'not set'}\n`);
    });

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkJobs();
