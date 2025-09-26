const HashValidator = require('./services/hashValidator');

async function testDynamicPasswordGeneration() {
  console.log('🧪 Testing Dynamic Password Generation...\n');
  
  try {
    const validator = new HashValidator();
    
    console.log('📊 Current Password Configuration:');
    console.log('===================================');
    console.log(`Password Length: ${validator.options.passwordLength}`);
    console.log(`Password Complexity: ${validator.options.passwordComplexity}`);
    console.log(`Password Charsets Available: ${Object.keys(validator.options.passwordCharsets || {}).join(', ')}`);
    
    console.log('\n🔑 Testing Password Generation:');
    console.log('===============================');
    
    // Test different complexity levels
    const complexities = ['low', 'medium', 'high'];
    
    for (const complexity of complexities) {
      console.log(`\n--- ${complexity.toUpperCase()} Complexity ---`);
      
      // Temporarily change complexity
      const originalComplexity = validator.options.passwordComplexity;
      validator.options.passwordComplexity = complexity;
      
      // Generate passwords
      for (let i = 1; i <= 3; i++) {
        const password = validator.generateSecurePassword();
        console.log(`Password ${i}: ${password}`);
        console.log(`Length: ${password.length} characters`);
      }
      
      // Restore original complexity
      validator.options.passwordComplexity = originalComplexity;
    }
    
    console.log('\n🔧 Testing Custom Charset Override:');
    console.log('====================================');
    
    // Test custom charset
    const customCharset = '0123456789ABCDEF';
    validator.options.passwordCharsets = {
      high: customCharset,
      medium: customCharset,
      low: customCharset
    };
    
    console.log(`Custom Charset: ${customCharset}`);
    for (let i = 1; i <= 3; i++) {
      const password = validator.generateSecurePassword();
      console.log(`Custom Password ${i}: ${password}`);
      console.log(`Contains only hex chars: ${/^[0-9A-F]+$/.test(password)}`);
    }
    
    console.log('\n✅ Dynamic password generation test completed');
    
  } catch (error) {
    console.error('❌ Error testing dynamic password generation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDynamicPasswordGeneration();
