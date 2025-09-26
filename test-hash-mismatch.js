const HashValidator = require('./services/hashValidator');

async function testHashMismatch() {
  console.log('🧪 Testing hash mismatch detection...');
  
  try {
    const validator = new HashValidator();
    
    // Check current status before validation
    console.log('\n📊 Status before validation:');
    const statusBefore = await validator.getStatus();
    console.log('Current Hash:', statusBefore.currentHash);
    console.log('Mismatch Count:', statusBefore.mismatchCount);
    
    // Perform validation (should detect mismatch)
    console.log('\n🔍 Performing validation (expecting mismatch)...');
    await validator.performValidation();
    
    // Check status after validation
    console.log('\n📊 Status after validation:');
    const statusAfter = await validator.getStatus();
    console.log('Current Hash:', statusAfter.currentHash);
    console.log('Mismatch Count:', statusAfter.mismatchCount);
    console.log('Last Validation:', statusAfter.lastValidation);
    
    // Perform validation multiple times to trigger password change
    console.log('\n🔄 Running multiple validations to trigger password change...');
    for (let i = 1; i <= 4; i++) {
      console.log(`\n--- Validation ${i} ---`);
      await validator.performValidation();
      
      const status = await validator.getStatus();
      console.log(`Mismatch Count: ${status.mismatchCount}`);
      
      if (status.lastValidation && status.lastValidation.result === 'FAIL') {
        console.log(`❌ Hash mismatch detected!`);
        console.log(`Current: ${status.lastValidation.hash}`);
        console.log(`Stored: ${status.lastValidation.storedHash}`);
      }
      
      // Small delay between validations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final status check
    console.log('\n📊 Final Status:');
    const finalStatus = await validator.getStatus();
    console.log('Mismatch Count:', finalStatus.mismatchCount);
    console.log('Last Validation:', finalStatus.lastValidation);
    
    // Check if password was changed
    const passwordData = await validator.loadCurrentPassword();
    if (passwordData) {
      console.log('\n🔑 Password Status:');
      console.log('Password hash:', passwordData.hash.substring(0, 16) + '...');
      console.log('Created at:', new Date(passwordData.createdAt).toISOString());
    }
    
    console.log('\n✅ Hash mismatch test completed');
    
  } catch (error) {
    console.error('❌ Error testing hash mismatch:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHashMismatch();
