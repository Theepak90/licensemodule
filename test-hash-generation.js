const HashValidator = require('./services/hashValidator');

async function testHashGeneration() {
  console.log('🧪 Testing hash generation...');
  
  try {
    const validator = new HashValidator();
    
    // Test hash generation multiple times
    console.log('\n📊 Generating hashes multiple times to check stability:');
    
    for (let i = 1; i <= 5; i++) {
      const hash = await validator.generateSystemHash();
      console.log(`Hash ${i}: ${hash.substring(0, 16)}...`);
      
      // Small delay to ensure any timing differences are captured
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test system info collection
    console.log('\n🔍 Testing system info collection:');
    const systemInfo = await validator.collectSystemInfo();
    console.log('System info keys:', Object.keys(systemInfo));
    console.log('Platform:', systemInfo.platform);
    console.log('Arch:', systemInfo.arch);
    console.log('Hostname:', systemInfo.hostname);
    
    if (systemInfo.cpu) {
      console.log('CPU:', systemInfo.cpu.manufacturer, systemInfo.cpu.brand);
    }
    
    console.log('\n✅ Hash generation test completed');
    
  } catch (error) {
    console.error('❌ Error testing hash generation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHashGeneration();
