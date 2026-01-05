// server/scripts/setupGoogleOAuth.js
console.log('🔧 Setting up Google OAuth for ThaiQuestify');
console.log('='.repeat(50));

console.log('\n📋 Step-by-Step Guide:');
console.log('\n1. Go to: https://console.cloud.google.com/');
console.log('2. Create or select your project: "ThaiQuestify"');
console.log('3. Go to: APIs & Services → Credentials');
console.log('4. Click "Create Credentials" → OAuth 2.0 Client IDs');
console.log('\n5. Configure OAuth Consent Screen:');
console.log('   - User Type: External');
console.log('   - App Name: ThaiQuestify');
console.log('   - User Support Email: your-email@gmail.com');
console.log('   - Developer Contact: your-email@gmail.com');
console.log('\n6. Create OAuth Client IDs:');

const configs = [
    {
        type: 'Web Application',
        name: 'ThaiQuestify Web',
        redirectURIs: [
            'https://thaiquestify.com/auth/callback',
            'http://localhost:3000/auth/callback'
        ]
    },
    {
        type: 'iOS',
        name: 'ThaiQuestify iOS',
        bundleId: 'com.thaiquestify.app'
    },
    {
        type: 'Android',
        name: 'ThaiQuestify Android',
        packageName: 'com.thaiquestify.app'
    }
];

configs.forEach((config, index) => {
    console.log(`\n${index + 1}. ${config.type}:`);
    console.log(`   Name: ${config.name}`);
    if (config.redirectURIs) {
        console.log(`   Authorized Redirect URIs:`);
        config.redirectURIs.forEach(uri => console.log(`     - ${uri}`));
    }
    if (config.bundleId) {
        console.log(`   Bundle ID: ${config.bundleId}`);
    }
    if (config.packageName) {
        console.log(`   Package Name: ${config.packageName}`);
    }
});

console.log('\n7. Copy the Client ID and Client Secret');
console.log('8. Add to your .env file:');
console.log('   GOOGLE_CLIENT_ID=your-client-id');
console.log('   GOOGLE_CLIENT_SECRET=your-client-secret');
console.log('\n9. Enable Google Sign-In in Firebase (optional):');
console.log('   - Go to Firebase Console');
console.log('   - Select your project');
console.log('   - Authentication → Sign-in method');
console.log('   - Enable Google');
console.log('\n✅ Setup Complete!');