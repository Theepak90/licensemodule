const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class TorroMilitarySelfDestruct {
  constructor(licenseKey, clientId, options = {}) {
    this.licenseKey = licenseKey;
    this.clientId = clientId;
    this.options = {
      apiUrl: options.apiUrl || process.env.TORRO_API_URL || 'http://localhost:3001/api',
      gracePeriod: options.gracePeriod || parseInt(process.env.TORRO_GRACE_PERIOD) || 300000, // 5 minutes
      validationInterval: options.validationInterval || parseInt(process.env.TORRO_VALIDATION_INTERVAL) || 60000, // 1 minute
      onValidationChange: options.onValidationChange || (() => {}),
      maxRetries: options.maxRetries || parseInt(process.env.TORRO_MAX_RETRIES) || 3,
      retryDelay: options.retryDelay || parseInt(process.env.TORRO_RETRY_DELAY) || 5000,
      ...options
    };
    
    this.isValid = false;
    this.licenseData = null;
    this.hardwareFingerprint = this.getHardwareFingerprint();
    this.validationInterval = null;
    this.selfDestructTriggered = false;
    
    // Check if application should start
    if (!this.shouldStart()) {
      console.log('❌ Application cannot start - license destroyed');
      process.exit(1);
    }
    
    // Start validation
    this.startPeriodicValidation();
  }

  // ==================== HARDWARE FINGERPRINTING ====================

  getHardwareFingerprint() {
    const hardwareComponents = {
      cpu: {
        model: os.cpus()[0].model,
        architecture: os.arch(),
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        release: os.release()
      },
      network: this.getNetworkFingerprint(),
      system: {
        hostname: os.hostname(),
        uptime: os.uptime(),
        userInfo: os.userInfo()
      },
      process: {
        platform: process.platform,
        arch: process.arch,
        version: process.version
      }
    };

    const fingerprint = crypto
      .createHash('sha512')
      .update(JSON.stringify(hardwareComponents))
      .digest('hex');

    return {
      fingerprint,
      components: hardwareComponents,
      timestamp: Date.now()
    };
  }

  getNetworkFingerprint() {
    const interfaces = os.networkInterfaces();
    const networkData = {};
    
    Object.keys(interfaces).forEach(name => {
      networkData[name] = interfaces[name].map(iface => ({
        address: iface.address,
        mac: iface.mac,
        family: iface.family,
        internal: iface.internal
      }));
    });
    
    return networkData;
  }

  // ==================== ANTI-DEBUGGING ====================

  detectDebugger() {
    const start = Date.now();
    debugger; // This will pause if debugger is attached
    const delay = Date.now() - start;
    const debuggerThreshold = parseInt(process.env.DEBUGGER_THRESHOLD) || 100;
    
    if (delay > debuggerThreshold) {
      this.logSecurityViolation('DEBUGGER_DETECTED', { 
        delay, 
        threshold: debuggerThreshold 
      });
      return true;
    }
    return false;
  }

  // ==================== INTEGRITY CHECKING ====================

  createIntegrityChecksum(data) {
    return {
      sha256: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
      sha512: crypto.createHash('sha512').update(JSON.stringify(data)).digest('hex'),
      timestamp: Date.now()
    };
  }

  verifyIntegrity(data, expectedChecksums) {
    const currentChecksums = this.createIntegrityChecksum(data);
    return currentChecksums.sha256 === expectedChecksums.sha256 &&
           currentChecksums.sha512 === expectedChecksums.sha512;
  }

  // ==================== LICENSE VALIDATION ====================

  async validateLicense() {
    try {
      // Detect debugger first
      const debuggerDetected = this.detectDebugger();
      
      if (debuggerDetected) {
        this.triggerSelfDestruction('DEBUGGER_DETECTED');
        return false;
      }

      const validationData = {
        licenseKey: this.licenseKey,
        clientId: this.clientId,
        hardwareFingerprint: this.hardwareFingerprint.fingerprint,
        timestamp: Date.now(),
        userAgent: process.env.USER_AGENT || 'Torro-Military-Client/1.0.0'
      };

      const response = await this.makeSecureRequest('/licenses/validate', {
        method: 'POST',
        body: validationData
      });

      if (response.valid) {
        // Verify hardware fingerprint
        if (response.license.hardwareFingerprint !== this.hardwareFingerprint.fingerprint) {
          this.logSecurityViolation('HARDWARE_FINGERPRINT_MISMATCH', {
            expected: response.license.hardwareFingerprint,
            actual: this.hardwareFingerprint.fingerprint
          });
          this.triggerSelfDestruction('HARDWARE_MISMATCH');
          return false;
        }

        // Verify integrity
        if (response.license.integrityChecksums && 
            !this.verifyIntegrity(response.license, response.license.integrityChecksums)) {
          this.logSecurityViolation('INTEGRITY_VIOLATION', {
            licenseId: response.license.licenseKey
          });
          this.triggerSelfDestruction('INTEGRITY_VIOLATION');
          return false;
        }

        // Check risk score
        if (response.riskScore && response.riskScore > 80) {
          this.logSecurityViolation('HIGH_RISK_SCORE', {
            riskScore: response.riskScore
          });
          this.triggerSelfDestruction('HIGH_RISK_SCORE');
          return false;
        }

        this.isValid = true;
        this.licenseData = response.license;
        
        this.options.onValidationChange(true, response.license, {
          riskScore: response.riskScore || 0,
          hardwareMatch: true,
          integrityValid: true
        });

        return true;
      } else {
        this.isValid = false;
        this.licenseData = null;
        
        this.options.onValidationChange(false, null, {
          reason: response.error || 'Unknown validation error'
        });

        return false;
      }
    } catch (error) {
      this.logSecurityViolation('VALIDATION_ERROR', {
        error: error.message,
        timestamp: Date.now()
      });
      
      this.isValid = false;
      this.licenseData = null;
      
      this.options.onValidationChange(false, null, {
        reason: 'Validation error: ' + error.message
      });

      return false;
    }
  }

  // ==================== SECURE COMMUNICATION ====================

  async makeSecureRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.options.apiUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Torro-Military-Client/1.0.0',
          'X-Client-ID': this.clientId,
          'X-License-Key': this.licenseKey,
          'X-Hardware-Fingerprint': this.hardwareFingerprint.fingerprint,
          'X-Timestamp': Date.now().toString(),
          ...options.headers
        }
      };

      if (options.body) {
        const body = JSON.stringify(options.body);
        requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  // ==================== PERIODIC VALIDATION ====================

  startPeriodicValidation(interval = this.options.validationInterval) {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    // Initial validation
    this.validateLicense();

    // Periodic validation
    this.validationInterval = setInterval(async () => {
      const isValid = await this.validateLicense();
      
      if (!isValid && !this.selfDestructTriggered) {
        // Grace period before self-destruction
        setTimeout(() => {
          if (!this.isValid) {
            this.triggerSelfDestruction('LICENSE_VALIDATION_FAILED');
          }
        }, this.options.gracePeriod);
      }
    }, interval);
  }

  stopPeriodicValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  // ==================== SELF-DESTRUCTION ====================

  militaryGradeSecureDelete(filePath) {
    try {
      if (!fs.existsSync(filePath)) return true;
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // 7-pass military-grade secure deletion
      for (let pass = 0; pass < 7; pass++) {
        const randomData = crypto.randomBytes(fileSize);
        fs.writeFileSync(filePath, randomData);
        fs.fsyncSync(fs.openSync(filePath, 'r+'));
      }
      
      // Final deletion
      fs.unlinkSync(filePath);
      
      this.logSecurityEvent('SECURE_DELETE_COMPLETED', { filePath, passes: 7 });
      return true;
    } catch (error) {
      this.logSecurityViolation('SECURE_DELETE_FAILED', { filePath, error: error.message });
      return false;
    }
  }

  createLockFile(reason) {
    const lockFileName = process.env.TORRO_LOCK_FILE_NAME || '.torro_license_destroyed';
    const lockFile = path.join(process.cwd(), lockFileName);
    const salt = process.env.TORRO_MILITARY_SALT || 'torro-military-salt';
    
    const lockData = {
      licenseKey: this.licenseKey,
      clientId: this.clientId,
      reason,
      timestamp: Date.now(),
      destroyed: true,
      hardwareFingerprint: this.hardwareFingerprint.fingerprint,
      signature: crypto.createHmac('sha256', salt)
        .update(this.licenseKey + this.clientId + reason + Date.now())
        .digest('hex')
    };
    
    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
    return lockFile;
  }

  triggerSelfDestruction(reason = 'SECURITY_VIOLATION') {
    if (this.selfDestructTriggered) return;
    
    this.selfDestructTriggered = true;
    this.isValid = false;
    
    this.logSecurityViolation('SELF_DESTRUCTION_TRIGGERED', {
      reason,
      licenseKey: this.licenseKey,
      clientId: this.clientId,
      timestamp: Date.now()
    });
    
    // Create lock file
    this.createLockFile(reason);
    
    // Get critical files from environment or use defaults
    const criticalFiles = process.env.TORRO_CRITICAL_FILES 
      ? process.env.TORRO_CRITICAL_FILES.split(',')
      : ['config.json', 'database.json', 'license.json', '.env', 'package.json', 'node_modules'];
    
    criticalFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file.trim());
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          this.deleteDirectory(filePath);
        } else {
          this.militaryGradeSecureDelete(filePath);
        }
      }
    });
    
    // Stop validation
    this.stopPeriodicValidation();
    
    // Notify callback
    this.options.onValidationChange(false, null, { selfDestruct: true, reason });
    
    // Exit process
    console.log('🚨 TORRO MILITARY SELF-DESTRUCTION COMPLETED');
    process.exit(1);
  }

  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.statSync(curPath).isDirectory()) {
          this.deleteDirectory(curPath);
        } else {
          this.militaryGradeSecureDelete(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }

  // ==================== STATIC METHODS ====================

  static shouldStart() {
    const lockFileName = process.env.TORRO_LOCK_FILE_NAME || '.torro_license_destroyed';
    const lockFile = path.join(process.cwd(), lockFileName);
    return !fs.existsSync(lockFile);
  }

  static createMilitaryLicense(licenseData) {
    const militarySecurity = new (require('./militarySecurity'))();
    return militarySecurity.createMilitaryGradeLicense(licenseData);
  }

  // ==================== LOGGING ====================

  logSecurityEvent(event, data) {
    const logEntry = {
      event,
      data,
      timestamp: Date.now(),
      level: 'INFO',
      licenseKey: this.licenseKey,
      clientId: this.clientId
    };
    
    console.log(`🔒 TORRO SECURITY: ${event}`, logEntry);
  }

  logSecurityViolation(violation, data) {
    const logEntry = {
      event: 'SECURITY_VIOLATION',
      violation,
      data,
      timestamp: Date.now(),
      level: 'CRITICAL',
      licenseKey: this.licenseKey,
      clientId: this.clientId
    };
    
    console.error(`🚨 TORRO SECURITY VIOLATION: ${violation}`, logEntry);
  }

  // ==================== PUBLIC API ====================

  getLicenseInfo() {
    return {
      isValid: this.isValid,
      licenseData: this.licenseData,
      hardwareFingerprint: this.hardwareFingerprint,
      selfDestructTriggered: this.selfDestructTriggered
    };
  }

  forceValidation() {
    return this.validateLicense();
  }

  destroy() {
    this.stopPeriodicValidation();
    this.triggerSelfDestruction('MANUAL_DESTRUCTION');
  }
}

module.exports = TorroMilitarySelfDestruct;
