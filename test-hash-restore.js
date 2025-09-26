const HashValidator = require('./services/hashValidator');

async function testHashRestore() {
  console.log('🧪 Testing hash validation after restoring correct hash...');
  
  try {
    const validator = new HashValidator();
    
    // Perform validation (should pass now)
    console.log('\n🔍 Performing validation (expecting PASS)...');
    await validator.performValidation();
    
    // Check status
    const status = await validator.getStatus();
    console.log('\n📊 Validation Status:');
    console.log('Current Hash:', status.currentHash);
    console.log('Mismatch Count:', status.mismatchCount);
    console.log('Last Validation:', status.lastValidation);
    
    if (status.lastValidation && status.lastValidation.result === 'PASS') {
      console.log('\n✅ Hash validation PASSED! System is secure.');
    } else {
      console.log('\n❌ Hash validation FAILED! Something is wrong.');
    }
    
    console.log('\n✅ Hash restore test completed');
    
  } catch (error) {
    console.error('❌ Error testing hash restore:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHashRestore();
