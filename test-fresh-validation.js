const HashValidator = require('./services/hashValidator');

async function testFreshValidation() {
  console.log('🧪 Testing with fresh HashValidator instance...');
  
  try {
    // Create a completely fresh instance
    const validator = new HashValidator();
    
    // Force reload the hash from file
    await validator.loadCurrentHash();
    
    // Check what hash is loaded
    console.log('\n📊 Loaded Hash:');
    console.log('Current Hash:', validator.currentHash ? validator.currentHash.substring(0, 16) + '...' : 'None');
    
    // Perform validation
    console.log('\n🔍 Performing validation...');
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
      console.log('\n❌ Hash validation FAILED!');
      console.log('Current:', status.lastValidation?.hash);
      console.log('Stored:', status.lastValidation?.storedHash);
    }
    
    console.log('\n✅ Fresh validation test completed');
    
  } catch (error) {
    console.error('❌ Error testing fresh validation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFreshValidation();
