const License = require('../models/License');
const fs = require('fs');
const path = require('path');

// Check for expired licenses and update their status
const checkExpiredLicenses = async () => {
  try {
    const now = new Date();
    
    // Find licenses that have expired but are still marked as active
    const expiredLicenses = await License.find({
      status: 'active',
      expiryDate: { $lt: now }
    });

    if (expiredLicenses.length > 0) {
      console.log(`🚨 Found ${expiredLicenses.length} expired license(s)`);
      
      // Update status to expired
      const updateResult = await License.updateMany(
        { 
          status: 'active',
          expiryDate: { $lt: now }
        },
        { 
          status: 'expired',
          updatedAt: new Date()
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} license(s) to expired status`);
      
      // Log expired licenses for audit
      for (const license of expiredLicenses) {
        console.log(`   - ${license.clientName} (${license.licenseKey}) expired on ${license.expiryDate}`);
      }
    }

    return expiredLicenses.length;
  } catch (error) {
    console.error('❌ Error checking expired licenses:', error);
    throw error;
  }
};

// Clean up expired licenses (delete after grace period)
const cleanupExpiredLicenses = async () => {
  try {
    const gracePeriod = 30; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - gracePeriod);

    // Find licenses that have been expired for more than the grace period
    const oldExpiredLicenses = await License.find({
      status: 'expired',
      expiryDate: { $lt: cutoffDate }
    });

    if (oldExpiredLicenses.length > 0) {
      console.log(`🧹 Found ${oldExpiredLicenses.length} old expired license(s) for cleanup`);
      
      // Create backup before deletion
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `expired_licenses_${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(oldExpiredLicenses, null, 2));
      
      // Delete expired licenses
      const deleteResult = await License.deleteMany({
        status: 'expired',
        expiryDate: { $lt: cutoffDate }
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} expired license(s)`);
      console.log(`📁 Backup created: ${backupFile}`);
    }

    return oldExpiredLicenses.length;
  } catch (error) {
    console.error('❌ Error cleaning up expired licenses:', error);
    throw error;
  }
};

// Self-destruct mechanism for client applications
const generateSelfDestructScript = (licenseData) => {
  const script = `
// Torro License Self-Destruct Script
// This script will disable the application when the license expires

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class LicenseManager {
  constructor() {
    this.licenseData = ${JSON.stringify(licenseData)};
    this.checkInterval = null;
    this.startLicenseCheck();
  }

  startLicenseCheck() {
    // Check license every minute
    this.checkInterval = setInterval(() => {
      this.validateLicense();
    }, 60000);

    // Initial check
    this.validateLicense();
  }

  validateLicense() {
    const now = new Date();
    const expiryDate = new Date(this.licenseData.expiryDate);

    if (now > expiryDate) {
      this.selfDestruct();
    }
  }

  selfDestruct() {
    console.log('🚨 License has expired. Application will self-destruct...');
    
    // Clear the license check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Disable critical application files
    this.disableApplication();
    
    // Log the destruction
    console.log('💥 Application self-destructed due to license expiration');
    
    // Exit the process
    process.exit(1);
  }

  disableApplication() {
    try {
      // Create a lock file to prevent application startup
      const lockFile = path.join(__dirname, '.license_expired');
      fs.writeFileSync(lockFile, JSON.stringify({
        expired: true,
        expiryDate: this.licenseData.expiryDate,
        timestamp: new Date().toISOString()
      }));

      // Remove critical configuration files
      const configFiles = [
        'config.json',
        'database.json',
        'api-keys.json'
      ];

      configFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

    } catch (error) {
      console.error('Error during self-destruct:', error);
    }
  }

  // Method to check if application should start
  static shouldStart() {
    const lockFile = path.join(__dirname, '.license_expired');
    return !fs.existsSync(lockFile);
  }
}

// Export for use in main application
module.exports = LicenseManager;

// Auto-start if this file is run directly
if (require.main === module) {
  const licenseManager = new LicenseManager();
}
`;

  return script;
};

// Generate client integration code
const generateClientIntegration = (licenseKey, clientId) => {
  const integrationCode = `
// Torro License Integration for Client Applications
// Include this code in your application to validate licenses

const axios = require('axios');

class TorroLicenseValidator {
  constructor(licenseKey, clientId, apiUrl = 'http://localhost:5000/api') {
    this.licenseKey = licenseKey;
    this.clientId = clientId;
    this.apiUrl = apiUrl;
    this.licenseData = null;
    this.isValid = false;
    this.checkInterval = null;
  }

  async validateLicense() {
    try {
      const response = await axios.post(\`\${this.apiUrl}/licenses/validate\`, {
        licenseKey: this.licenseKey,
        clientId: this.clientId
      });

      this.licenseData = response.data.license;
      this.isValid = response.data.valid;
      
      return this.isValid;
    } catch (error) {
      console.error('License validation failed:', error.response?.data || error.message);
      this.isValid = false;
      return false;
    }
  }

  startPeriodicValidation(intervalMinutes = 60) {
    // Initial validation
    this.validateLicense();

    // Periodic validation
    this.checkInterval = setInterval(() => {
      this.validateLicense();
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicValidation() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  isLicenseValid() {
    return this.isValid;
  }

  getLicenseInfo() {
    return this.licenseData;
  }
}

module.exports = TorroLicenseValidator;
`;

  return integrationCode;
};

module.exports = {
  checkExpiredLicenses,
  cleanupExpiredLicenses,
  generateSelfDestructScript,
  generateClientIntegration
};


