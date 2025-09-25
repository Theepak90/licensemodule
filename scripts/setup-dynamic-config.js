#!/usr/bin/env node

const DynamicConfig = require('../utils/dynamicConfig');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DynamicConfigSetup {
  constructor() {
    this.config = new DynamicConfig();
  }

  async setup() {
    console.log('🔧 TORRO DYNAMIC CONFIGURATION SETUP');
    console.log('=====================================\n');

    try {
      // 1. Generate secure keys
      await this.generateSecureKeys();
      
      // 2. Create directories
      await this.createDirectories();
      
      // 3. Validate configuration
      await this.validateConfiguration();
      
      // 4. Save configuration
      await this.saveConfiguration();
      
      // 5. Test configuration
      await this.testConfiguration();
      
      console.log('\n✅ Dynamic configuration setup completed successfully!');
      console.log('📁 Configuration saved to: .env');
      console.log('🔐 Secure keys generated and configured');
      console.log('📂 Required directories created');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async generateSecureKeys() {
    console.log('🔐 Generating secure keys...');
    
    // Generate encryption key
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    this.config.set('encryption.key', encryptionKey);
    
    // Generate JWT secret
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    this.config.set('jwt.secret', jwtSecret);
    
    // Generate license salt
    const licenseSalt = crypto.randomBytes(32).toString('hex');
    this.config.set('encryption.salt', licenseSalt);
    
    // Generate hash validation salt
    const hashSalt = crypto.randomBytes(32).toString('hex');
    this.config.set('hashValidation.salt', hashSalt);
    
    // Generate military salt
    const militarySalt = crypto.randomBytes(32).toString('hex');
    this.config.set('client.militarySalt', militarySalt);
    
    console.log('✅ Secure keys generated');
  }

  async createDirectories() {
    console.log('📂 Creating required directories...');
    
    const directories = [
      'logs',
      'keys',
      'keys/history',
      'keys/hashes',
      'keys/passwords',
      'client/public',
      'client/src',
      'client/src/components',
      'client/src/contexts',
      'client/src/api',
      'services',
      'services/daemons',
      'routes',
      'middleware',
      'models',
      'utils',
      'scripts',
      'examples'
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  📁 Created: ${dir}`);
      }
    }
    
    console.log('✅ Directories created');
  }

  async validateConfiguration() {
    console.log('🔍 Validating configuration...');
    
    const validation = this.config.validateConfig();
    
    if (!validation.isValid) {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
      throw new Error('Configuration validation failed');
    }
    
    console.log('✅ Configuration validation passed');
  }

  async saveConfiguration() {
    console.log('💾 Saving configuration...');
    
    const envPath = '.env';
    this.config.saveConfig(envPath);
    
    // Also save a backup
    const backupPath = `.env.backup.${Date.now()}`;
    this.config.saveConfig(backupPath);
    
    console.log(`✅ Configuration saved to: ${envPath}`);
    console.log(`📋 Backup saved to: ${backupPath}`);
  }

  async testConfiguration() {
    console.log('🧪 Testing configuration...');
    
    try {
      // Test server configuration
      const serverConfig = this.config.getServerConfig();
      console.log(`  🌐 Server: ${serverConfig.host}:${serverConfig.port}`);
      
      // Test database configuration
      const dbConfig = this.config.getDatabaseConfig();
      console.log(`  🗄️  Database: ${dbConfig.uri}`);
      
      // Test encryption configuration
      const encConfig = this.config.getEncryptionConfig();
      console.log(`  🔐 Encryption: ${encConfig.key.substring(0, 8)}...`);
      
      // Test military security configuration
      const milConfig = this.config.getMilitarySecurityConfig();
      console.log(`  🛡️  Military Security: ${milConfig.enabled ? 'Enabled' : 'Disabled'}`);
      
      // Test key rotation configuration
      const keyConfig = this.config.getKeyRotationConfig();
      console.log(`  🔄 Key Rotation: ${keyConfig.interval}ms`);
      
      // Test hash validation configuration
      const hashConfig = this.config.getHashValidationConfig();
      console.log(`  🔍 Hash Validation: ${hashConfig.enabled ? 'Enabled' : 'Disabled'}`);
      
      console.log('✅ Configuration test passed');
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error.message);
      throw error;
    }
  }

  // Interactive setup for production
  async interactiveSetup() {
    console.log('🎯 INTERACTIVE DYNAMIC CONFIGURATION SETUP');
    console.log('==========================================\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
    
    try {
      // Server configuration
      const port = await question('Enter server port (default: 3001): ');
      if (port) this.config.set('server.port', parseInt(port));
      
      const host = await question('Enter server host (default: localhost): ');
      if (host) this.config.set('server.host', host);
      
      // Database configuration
      const dbUri = await question('Enter MongoDB URI (default: mongodb://localhost:27017/torro_licenses): ');
      if (dbUri) this.config.set('database.uri', dbUri);
      
      // Security configuration
      const enableMilitary = await question('Enable military-grade security? (y/n, default: y): ');
      this.config.set('militarySecurity.enabled', enableMilitary.toLowerCase() !== 'n');
      
      const enableHashValidation = await question('Enable hash validation? (y/n, default: y): ');
      this.config.set('hashValidation.enabled', enableHashValidation.toLowerCase() !== 'n');
      
      // Key rotation configuration
      const keyRotationInterval = await question('Enter key rotation interval in minutes (default: 60): ');
      if (keyRotationInterval) {
        this.config.set('keyRotation.interval', parseInt(keyRotationInterval) * 60 * 1000);
      }
      
      // Hash validation configuration
      const hashValidationInterval = await question('Enter hash validation interval in seconds (default: 30): ');
      if (hashValidationInterval) {
        this.config.set('hashValidation.interval', parseInt(hashValidationInterval) * 1000);
      }
      
      console.log('\n✅ Interactive configuration completed');
      
    } finally {
      rl.close();
    }
  }

  // Show current configuration
  showConfiguration() {
    console.log('📋 CURRENT DYNAMIC CONFIGURATION');
    console.log('=================================\n');
    
    const config = this.config.getAll();
    
    console.log('🌐 Server Configuration:');
    console.log(`  Port: ${config.server.port}`);
    console.log(`  Host: ${config.server.host}`);
    console.log(`  Environment: ${config.server.nodeEnv}`);
    console.log('');
    
    console.log('🗄️  Database Configuration:');
    console.log(`  URI: ${config.database.uri}`);
    console.log(`  Name: ${config.database.name}`);
    console.log('');
    
    console.log('🔐 Security Configuration:');
    console.log(`  Military Security: ${config.militarySecurity.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`  Hash Validation: ${config.hashValidation.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`  Hardware Binding: ${config.militarySecurity.hardwareBindingRequired ? 'Required' : 'Optional'}`);
    console.log(`  Anti-Tampering: ${config.militarySecurity.antiTamperingEnabled ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    console.log('🔄 Key Rotation Configuration:');
    console.log(`  Interval: ${config.keyRotation.interval}ms`);
    console.log(`  Sleep Interval: ${config.keyRotation.sleepInterval}ms`);
    console.log(`  Key Length: ${config.keyRotation.keyLength} bytes`);
    console.log(`  Algorithm: ${config.keyRotation.algorithm}`);
    console.log('');
    
    console.log('🔍 Hash Validation Configuration:');
    console.log(`  Interval: ${config.hashValidation.interval}ms`);
    console.log(`  Max Mismatch Attempts: ${config.hashValidation.maxMismatchAttempts}`);
    console.log(`  Password Change on Mismatch: ${config.hashValidation.passwordChangeOnMismatch ? 'Enabled' : 'Disabled'}`);
    console.log(`  Password Length: ${config.hashValidation.passwordLength} characters`);
    console.log(`  Password Complexity: ${config.hashValidation.passwordComplexity}`);
    console.log('');
    
    console.log('🌍 Network Security Configuration:');
    console.log(`  Allowed Countries: ${config.networkSecurity.allowedCountries.join(', ')}`);
    console.log(`  Max Requests per Hour: ${config.networkSecurity.maxRequestsPerHour}`);
    console.log(`  Rate Limit Window: ${config.networkSecurity.rateLimitWindowMs}ms`);
    console.log(`  Rate Limit Max Requests: ${config.networkSecurity.rateLimitMaxRequests}`);
    console.log('');
    
    console.log('📊 Risk Scoring Configuration:');
    console.log(`  Hardware Mismatch Weight: ${config.riskScoring.hardwareMismatch}`);
    console.log(`  IP Mismatch Weight: ${config.riskScoring.ipMismatch}`);
    console.log(`  Geo Mismatch Weight: ${config.riskScoring.geoMismatch}`);
    console.log(`  Debugger Weight: ${config.riskScoring.debugger}`);
    console.log(`  Integrity Weight: ${config.riskScoring.integrity}`);
    console.log(`  High Frequency Weight: ${config.riskScoring.highFrequency}`);
    console.log(`  Max Risk Score: ${config.riskScoring.maxRiskScore}`);
    console.log('');
    
    console.log('📁 Storage Configuration:');
    console.log(`  Key Storage: ${config.storage.keyStoragePath}`);
    console.log(`  Key History: ${config.storage.keyHistoryPath}`);
    console.log(`  Hash Storage: ${config.storage.hashStoragePath}`);
    console.log(`  Password Storage: ${config.storage.passwordStoragePath}`);
    console.log('');
    
    console.log('📝 Logging Configuration:');
    console.log(`  Log Directory: ${config.logging.logDir}`);
    console.log(`  Log File: ${config.logging.logFile}`);
    console.log(`  Violations File: ${config.logging.violationsFile}`);
    console.log(`  Metrics File: ${config.logging.metricsFile}`);
    console.log(`  Retention Days: ${config.logging.retentionDays}`);
    console.log('');
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const setup = new DynamicConfigSetup();
  
  switch (command) {
    case 'setup':
      await setup.setup();
      break;
    case 'interactive':
      await setup.interactiveSetup();
      await setup.saveConfiguration();
      break;
    case 'show':
      setup.showConfiguration();
      break;
    case 'validate':
      const validation = setup.config.validateConfig();
      if (validation.isValid) {
        console.log('✅ Configuration is valid');
      } else {
        console.log('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      }
      break;
    default:
      console.log('🔧 Torro Dynamic Configuration Setup');
      console.log('=====================================');
      console.log('');
      console.log('Usage: node scripts/setup-dynamic-config.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  setup       Setup dynamic configuration with secure keys');
      console.log('  interactive Interactive setup for production');
      console.log('  show        Show current configuration');
      console.log('  validate    Validate current configuration');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/setup-dynamic-config.js setup');
      console.log('  node scripts/setup-dynamic-config.js interactive');
      console.log('  node scripts/setup-dynamic-config.js show');
      break;
  }
}

main().catch(console.error);
