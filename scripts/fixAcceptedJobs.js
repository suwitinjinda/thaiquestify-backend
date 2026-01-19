// Script to fix jobs with accepted applications
// Run with: node scripts/fixAcceptedJobs.js
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

async function fixAcceptedJobs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Starting auto-fix for jobs with accepted applications...\n');
    
    let fixedCount = 0;
    let checkedCount = 0;
    const fixedJobs = [];

    // Find all accepted applications
    const acceptedApps = await JobApplication.find({ status: 'accepted' });
    console.log(`📋 Found ${acceptedApps.length} accepted applications\n`);

    for (const app of acceptedApps) {
      checkedCount++;
      
      const job = await Job.findById(app.job);
      
      if (!job) {
        console.warn(`⚠️  Application ${app._id} references non-existent job ${app.job}`);
        continue;
      }
      
      // Check if job needs fixing
      const needsFix = job.status !== 'in_progress' && job.status !== 'completed';
      const needsWorker = !job.worker || (job.worker.toString() !== app.worker.toString());
      const needsAcceptedWorkers = (job.acceptedWorkers || 0) === 0;
      
      if (needsFix || needsWorker || needsAcceptedWorkers) {
        console.log(`🔧 Fixing job: "${job.title}" (${job._id})`);
        console.log(`   Current status: ${job.status}`);
        
        // Build update object
        const updateObj = {};
        
        if (needsFix) {
          updateObj.status = 'in_progress';
          console.log(`   ✨ Setting status to 'in_progress'`);
        }
        
        if (needsWorker) {
          updateObj.worker = app.worker;
          console.log(`   ✨ Setting worker to ${app.worker}`);
        }
        
        if (needsAcceptedWorkers) {
          updateObj.acceptedWorkers = 1;
          console.log(`   ✨ Setting acceptedWorkers to 1`);
        }
        
        // Update job
        const updatedJob = await Job.findByIdAndUpdate(
          job._id,
          { $set: updateObj },
          { new: true }
        );
        
        if (updatedJob) {
          fixedCount++;
          fixedJobs.push({
            jobId: job._id,
            title: job.title,
            oldStatus: job.status,
            newStatus: updatedJob.status,
          });
          console.log(`   ✅ Job updated successfully!\n`);
        }
      }
      
      // Also ensure acceptedAt is set
      if (!app.acceptedAt) {
        console.log(`   ✨ Setting acceptedAt for application ${app._id}`);
        app.acceptedAt = new Date();
        await app.save();
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Checked: ${checkedCount} accepted applications`);
    console.log(`   Fixed: ${fixedCount} jobs\n`);

    if (fixedJobs.length > 0) {
      console.log('✅ Fixed jobs:');
      fixedJobs.forEach(job => {
        console.log(`   - "${job.title}" (${job.jobId}): ${job.oldStatus} → ${job.newStatus}`);
      });
    } else {
      console.log('ℹ️  No jobs needed fixing - all jobs are already correct!');
    }

    console.log('\n✅ Auto-fix completed!\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error in auto-fix:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the fix
fixAcceptedJobs();
