/**
 * Torro License Manager - Client Integration Example
 * 
 * This file demonstrates how to integrate license validation into your client application.
 * Copy and modify this code to suit your application's needs.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TorroLicenseValidator {
  constructor(licenseKey, clientId, options = {}) {
    this.licenseKey = licenseKey;
    this.clientId = clientId;
    this.apiUrl = options.apiUrl || 'http://localhost:5000/api';
    this.checkInterval = options.checkInterval || 60; // minutes
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 5000; // milliseconds
    
    this.isValid = false;
    this.licenseData = null;
    this.checkTimer = null;
    this.lastCheck = null;
    this.onValidationChange = options.onValidationChange || (() => {});
  }

  /**
   * Validate the license with the server
   */
  async validateLicense() {
    try {
      console.log('🔍 Validating license...');
      
      const response = await axios.post(`${this.apiUrl}/licenses/validate`, {
        licenseKey: this.licenseKey,
        clientId: this.clientId
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const wasValid = this.isValid;
      this.isValid = response.data.valid;
      this.licenseData = response.data.license;
      this.lastCheck = new Date();

      // Notify if validation status changed
      if (wasValid !== this.isValid) {
        this.onValidationChange(this.isValid, this.licenseData);
      }

      if (this.isValid) {
        console.log('✅ License validation successful');
      } else {
        console.log('❌ License validation failed');
      }

      return this.isValid;

    } catch (error) {
      console.error('❌ License validation error:', error.response?.data || error.message);
      
      // Retry logic
      if (this.retryAttempts > 0) {
        this.retryAttempts--;
        console.log(`🔄 Retrying in ${this.retryDelay}ms... (${this.retryAttempts} attempts left)`);
        
        setTimeout(() => {
          this.validateLicense();
        }, this.retryDelay);
      } else {
        this.isValid = false;
        this.onValidationChange(false, null);
      }

      return false;
    }
  }

  /**
   * Start periodic license validation
   */
  startPeriodicValidation(intervalMinutes = null) {
    if (intervalMinutes) {
      this.checkInterval = intervalMinutes;
    }

    console.log(`🕐 Starting periodic license validation every ${this.checkInterval} minutes`);

    // Initial validation
    this.validateLicense();

    // Set up periodic checks
    this.checkTimer = setInterval(() => {
      this.validateLicense();
    }, this.checkInterval * 60 * 1000);

    return this;
  }

  /**
   * Stop periodic license validation
   */
  stopPeriodicValidation() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('⏹️  Periodic license validation stopped');
    }
    return this;
  }

  /**
   * Check if license is currently valid
   */
  isLicenseValid() {
    return this.isValid;
  }

  /**
   * Get license information
   */
  getLicenseInfo() {
    return this.licenseData;
  }

  /**
   * Get last check timestamp
   */
  getLastCheck() {
    return this.lastCheck;
  }

  /**
   * Force a license check
   */
  async forceCheck() {
    return await this.validateLicense();
  }

  /**
   * Check if license is expiring soon
   */
  isExpiringSoon(daysThreshold = 7) {
    if (!this.licenseData || !this.licenseData.daysUntilExpiry) {
      return false;
    }
    return this.licenseData.daysUntilExpiry <= daysThreshold && this.licenseData.daysUntilExpiry > 0;
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry() {
    return this.licenseData?.daysUntilExpiry || null;
  }
}

/**
 * Self-Destruct License Manager
 * This class implements self-destruction when license expires
 */
class SelfDestructLicenseManager extends TorroLicenseValidator {
  constructor(licenseKey, clientId, options = {}) {
    super(licenseKey, clientId, options);
    this.destructionTriggered = false;
    this.gracePeriod = options.gracePeriod || 5; // minutes
    this.lockFile = options.lockFile || '.license_expired';
  }

  /**
   * Override validation to trigger self-destruction
   */
  async validateLicense() {
    const isValid = await super.validateLicense();
    
    if (!isValid && !this.destructionTriggered) {
      this.triggerSelfDestruction();
    }
    
    return isValid;
  }

  /**
   * Trigger self-destruction sequence
   */
  triggerSelfDestruction() {
    if (this.destructionTriggered) {
      return;
    }

    this.destructionTriggered = true;
    console.log('🚨 License expired! Starting self-destruction sequence...');
    
    // Stop periodic validation
    this.stopPeriodicValidation();
    
    // Create lock file
    this.createLockFile();
    
    // Notify about destruction
    this.onValidationChange(false, this.licenseData, { selfDestruct: true });
    
    // Grace period before actual destruction
    setTimeout(() => {
      this.performSelfDestruction();
    }, this.gracePeriod * 60 * 1000);
  }

  /**
   * Create lock file to prevent application restart
   */
  createLockFile() {
    try {
      const lockData = {
        expired: true,
        expiryDate: this.licenseData?.expiryDate,
        clientId: this.clientId,
        licenseKey: this.licenseKey.substring(0, 10) + '...',
        timestamp: new Date().toISOString(),
        gracePeriod: this.gracePeriod
      };

      fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
      console.log(`📄 Lock file created: ${this.lockFile}`);
    } catch (error) {
      console.error('❌ Failed to create lock file:', error.message);
    }
  }

  /**
   * Perform actual self-destruction
   */
  performSelfDestruction() {
    console.log('💥 Performing self-destruction...');
    
    try {
      // Remove critical application files
      const criticalFiles = [
        'config.json',
        'database.json',
        'api-keys.json',
        'app.js',
        'server.js'
      ];

      criticalFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed: ${file}`);
        }
      });

      // Clear environment variables
      process.env.LICENSE_KEY = '';
      process.env.CLIENT_ID = '';

      console.log('💥 Application self-destructed due to license expiration');
      
    } catch (error) {
      console.error('❌ Error during self-destruction:', error.message);
    } finally {
      // Exit the process
      process.exit(1);
    }
  }

  /**
   * Check if application should start (no lock file)
   */
  static shouldStart() {
    const lockFile = '.license_expired';
    return !fs.existsSync(lockFile);
  }

  /**
   * Remove lock file (for testing)
   */
  static removeLockFile() {
    const lockFile = '.license_expired';
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log('🔓 Lock file removed');
    }
  }
}

/**
 * Example usage
 */
async function example() {
  // Basic license validation
  console.log('=== Basic License Validation ===');
  
  const validator = new TorroLicenseValidator(
    'YOUR_LICENSE_KEY',
    'YOUR_CLIENT_ID',
    {
      apiUrl: 'http://localhost:5000/api',
      checkInterval: 60, // minutes
      onValidationChange: (isValid, licenseData) => {
        console.log(`License status changed: ${isValid ? 'VALID' : 'INVALID'}`);
        if (licenseData) {
          console.log(`Days until expiry: ${licenseData.daysUntilExpiry}`);
        }
      }
    }
  );

  // Start periodic validation
  validator.startPeriodicValidation();

  // Self-destruct license manager
  console.log('\n=== Self-Destruct License Manager ===');
  
  const selfDestruct = new SelfDestructLicenseManager(
    'YOUR_LICENSE_KEY',
    'YOUR_CLIENT_ID',
    {
      gracePeriod: 5, // minutes
      onValidationChange: (isValid, licenseData, options = {}) => {
        if (options.selfDestruct) {
          console.log('⚠️  Self-destruction triggered! Application will shut down in 5 minutes.');
        }
      }
    }
  );

  selfDestruct.startPeriodicValidation();

  // Check if application should start
  if (!SelfDestructLicenseManager.shouldStart()) {
    console.log('❌ Application cannot start - license expired');
    process.exit(1);
  }
}

// Export classes for use in other modules
module.exports = {
  TorroLicenseValidator,
  SelfDestructLicenseManager
};

// Run example if this file is executed directly
if (require.main === module) {
  example().catch(console.error);
}

