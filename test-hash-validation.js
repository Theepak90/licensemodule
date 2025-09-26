const HashValidator = require('./services/hashValidator');

async function testHashValidation() {
  console.log('🧪 Testing full hash validation system...');
  
  try {
    const validator = new HashValidator();
    
    // Start validation
    console.log('\n🚀 Starting hash validation...');
    await validator.startValidation();
    
    // Wait a bit for validation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check status
    const status = await validator.getStatus();
    console.log('\n📊 Hash Validator Status:');
    console.log('Running:', status.isRunning);
    console.log('Current Hash:', status.currentHash);
    console.log('Mismatch Count:', status.mismatchCount);
    console.log('Last Validation:', status.lastValidation);
    
    // Stop validation
    await validator.stopValidation();
    
    console.log('\n✅ Hash validation test completed');
    
  } catch (error) {
    console.error('❌ Error testing hash validation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHashValidation();
