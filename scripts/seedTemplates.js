// backend/scripts/seedTemplates.js
const mongoose = require('mongoose');
const QuestTemplate = require('../models/QuestTemplate');
const User = require('../models/User');

const seedTemplates = async () => {
  await mongoose.connect('mongodb://localhost:27017/thaiquestify');
  
  // Find admin user
  const adminUser = await User.findOne({ userType: 'admin' });
  
  if (!adminUser) {
    console.log('No admin user found. Please create an admin user first.');
    return;
  }

  const initialTemplates = [
    {
      name: 'Follow Facebook Page',
      description: 'Follow our Facebook page to stay updated with latest news and promotions',
      type: 'social_media',
      instructions: '1. Visit our Facebook page\n2. Click the Follow button\n3. Take a screenshot of the followed page as proof',
      verificationMethod: 'screenshot',
      rewardPoints: 50,
      rewardAmount: 10,
      category: 'Social Media',
      estimatedTime: 2,
      requiredData: {
        facebook_url: 'https://facebook.com/',
        page_name: 'Page Name'
      },
      createdBy: adminUser._id,
      tags: ['social', 'facebook', 'follow']
    },
    {
      name: 'Website Visit',
      description: 'Visit our website and explore our services',
      type: 'website_visit',
      instructions: '1. Visit our website\n2. Spend at least 2 minutes browsing\n3. Take a screenshot of the website',
      verificationMethod: 'screenshot',
      rewardPoints: 30,
      rewardAmount: 5,
      category: 'Website',
      estimatedTime: 3,
      createdBy: adminUser._id,
      tags: ['website', 'visit', 'browsing']
    }
  ];

  await QuestTemplate.deleteMany({});
  await QuestTemplate.insertMany(initialTemplates);
  
  console.log('Initial quest templates seeded successfully');
  process.exit(0);
};

seedTemplates().catch(console.error);