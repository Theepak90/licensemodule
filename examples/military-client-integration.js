const { TorroMilitarySelfDestruct } = require('../services/militaryClient');

// ==================== BASIC MILITARY-GRADE INTEGRATION ====================

// Check if application should start
if (!TorroMilitarySelfDestruct.shouldStart()) {
  console.log('❌ Application cannot start - license destroyed');
  process.exit(1);
}

// Initialize military-grade license validator
const validator = new TorroMilitarySelfDestruct(
  'YOUR_MILITARY_LICENSE_KEY',
  'YOUR_CLIENT_ID',
  {
    apiUrl: 'http://localhost:3001/api',
    gracePeriod: 300000, // 5 minutes
    validationInterval: 60000, // 1 minute
    onValidationChange: (isValid, licenseData, options) => {
      if (isValid) {
        console.log('✅ License validated successfully');
        console.log('📊 License Info:', {
          clientName: licenseData.clientName,
          licenseType: licenseData.licenseType,
          expiryDate: licenseData.expiryDate,
          features: licenseData.features,
          riskScore: options.riskScore || 0
        });
      } else {
        console.log('❌ License validation failed');
        if (options.selfDestruct) {
          console.log('🚨 SELF-DESTRUCTION TRIGGERED!');
          console.log('Reason:', options.reason);
          // Handle destruction gracefully
          process.exit(1);
        }
      }
    }
  }
);

// ==================== ADVANCED INTEGRATION WITH CUSTOM HANDLERS ====================

class MyApplication {
  constructor() {
    this.validator = null;
    this.isRunning = false;
    this.licenseData = null;
  }

  async initialize() {
    try {
      // Initialize military-grade validator
      this.validator = new TorroMilitarySelfDestruct(
        process.env.TORRO_LICENSE_KEY,
        process.env.TORRO_CLIENT_ID,
        {
          apiUrl: process.env.TORRO_API_URL || 'http://localhost:3001/api',
          gracePeriod: parseInt(process.env.TORRO_GRACE_PERIOD) || 300000,
          validationInterval: parseInt(process.env.TORRO_VALIDATION_INTERVAL) || 60000,
          onValidationChange: this.handleValidationChange.bind(this)
        }
      );

      // Start the application
      await this.start();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  handleValidationChange(isValid, licenseData, options) {
    if (isValid) {
      this.licenseData = licenseData;
      this.isRunning = true;
      console.log('✅ Application license validated');
      
      // Log security metrics
      if (options.riskScore !== undefined) {
        console.log(`📊 Security Risk Score: ${options.riskScore}/100`);
      }
      
      if (options.hardwareMatch !== undefined) {
        console.log(`🔒 Hardware Match: ${options.hardwareMatch ? 'Valid' : 'Invalid'}`);
      }
      
      if (options.integrityValid !== undefined) {
        console.log(`🛡️ Integrity Check: ${options.integrityValid ? 'Valid' : 'Invalid'}`);
      }
      
    } else {
      this.isRunning = false;
      console.log('❌ Application license invalid');
      
      if (options.selfDestruct) {
        console.log('🚨 SELF-DESTRUCTION TRIGGERED!');
        console.log('Reason:', options.reason);
        this.handleSelfDestruction(options.reason);
      } else {
        console.log('⚠️ Grace period started - application will shut down soon');
        this.handleGracePeriod(options.reason);
      }
    }
  }

  async start() {
    if (!this.validator) {
      throw new Error('Validator not initialized');
    }

    // Wait for initial validation
    const isValid = await this.validator.validateLicense();
    
    if (!isValid) {
      throw new Error('Initial license validation failed');
    }

    this.isRunning = true;
    console.log('🚀 Application started with military-grade security');
    
    // Start your application logic here
    this.runApplicationLogic();
  }

  runApplicationLogic() {
    // Your application logic goes here
    console.log('🔄 Application running...');
    
    // Example: Periodic health check
    setInterval(() => {
      if (this.isRunning) {
        console.log('💓 Application heartbeat');
        
        // Check license status
        const licenseInfo = this.validator.getLicenseInfo();
        console.log('📋 License Status:', {
          isValid: licenseInfo.isValid,
          selfDestructTriggered: licenseInfo.selfDestructTriggered
        });
      }
    }, 30000); // Every 30 seconds
  }

  handleGracePeriod(reason) {
    console.log('⏰ Grace period active - preparing for shutdown');
    
    // Save any critical data
    this.saveCriticalData();
    
    // Notify users
    this.notifyUsers('Application will shut down due to license issues');
    
    // Schedule shutdown
    setTimeout(() => {
      console.log('🛑 Grace period expired - shutting down');
      process.exit(1);
    }, 300000); // 5 minutes
  }

  handleSelfDestruction(reason) {
    console.log('💥 SELF-DESTRUCTION INITIATED');
    console.log('Reason:', reason);
    
    // Immediate shutdown
    this.saveCriticalData();
    this.notifyUsers('Application shutting down due to security violation');
    
    // The validator will handle the actual destruction
    this.validator.destroy();
  }

  saveCriticalData() {
    // Save any critical data before shutdown
    console.log('💾 Saving critical data...');
    // Implementation depends on your application
  }

  notifyUsers(message) {
    // Notify users about the shutdown
    console.log('📢 User notification:', message);
    // Implementation depends on your application
  }

  // Manual license validation
  async validateLicense() {
    if (this.validator) {
      return await this.validator.validateLicense();
    }
    return false;
  }

  // Get license information
  getLicenseInfo() {
    if (this.validator) {
      return this.validator.getLicenseInfo();
    }
    return null;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down application...');
    this.isRunning = false;
    
    if (this.validator) {
      this.validator.stopPeriodicValidation();
    }
    
    // Cleanup
    process.exit(0);
  }
}

// ==================== USAGE EXAMPLES ====================

// Example 1: Basic usage
async function basicExample() {
  const validator = new TorroMilitarySelfDestruct(
    'YOUR_LICENSE_KEY',
    'YOUR_CLIENT_ID',
    {
      onValidationChange: (isValid, licenseData, options) => {
        if (isValid) {
          console.log('License valid - starting application');
          // Start your application
        } else {
          console.log('License invalid - shutting down');
          process.exit(1);
        }
      }
    }
  );
}

// Example 2: Advanced usage with custom application
async function advancedExample() {
  const app = new MyApplication();
  await app.initialize();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await app.shutdown();
  });
  
  process.on('SIGTERM', async () => {
    await app.shutdown();
  });
}

// Example 3: Manual validation
async function manualValidationExample() {
  const validator = new TorroMilitarySelfDestruct(
    'YOUR_LICENSE_KEY',
    'YOUR_CLIENT_ID'
  );
  
  // Manual validation
  const isValid = await validator.validateLicense();
  console.log('License valid:', isValid);
  
  // Get license info
  const info = validator.getLicenseInfo();
  console.log('License info:', info);
}

// ==================== ENVIRONMENT VARIABLES ====================

// Required environment variables:
// TORRO_LICENSE_KEY=your-military-license-key
// TORRO_CLIENT_ID=your-client-id
// TORRO_API_URL=http://localhost:3001/api (optional)
// TORRO_GRACE_PERIOD=300000 (optional, in milliseconds)
// TORRO_VALIDATION_INTERVAL=60000 (optional, in milliseconds)

// ==================== ERROR HANDLING ====================

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ==================== EXPORT FOR TESTING ====================

module.exports = {
  MyApplication,
  basicExample,
  advancedExample,
  manualValidationExample
};

// ==================== RUN EXAMPLES ====================

if (require.main === module) {
  // Run the advanced example
  advancedExample().catch(console.error);
}
