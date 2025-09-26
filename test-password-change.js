const HashValidator = require('./services/hashValidator');

async function testPasswordChange() {
  console.log('🧪 Testing password change mechanism...');
  
  try {
    const validator = new HashValidator();
    
    // Force a password change
    console.log('\n🔑 Forcing password change...');
    await validator.forcePasswordChange();
    
    // Check if password was stored
    const passwordData = await validator.loadCurrentPassword();
    if (passwordData) {
      console.log('✅ Password change successful');
      console.log('Password hash:', passwordData.hash.substring(0, 16) + '...');
      console.log('Algorithm:', passwordData.algorithm);
      console.log('Created at:', new Date(passwordData.createdAt).toISOString());
    } else {
      console.log('❌ No password data found');
    }
    
    // Check status
    const status = await validator.getStatus();
    console.log('\n📊 Status after password change:');
    console.log('Current Password:', status.currentPassword ? '***' : 'None');
    
    console.log('\n✅ Password change test completed');
    
  } catch (error) {
    console.error('❌ Error testing password change:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPasswordChange();
