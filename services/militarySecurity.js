const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const DynamicConfig = require('../utils/dynamicConfig');

// Load dynamic configuration
const config = new DynamicConfig();

// Get configurations
const encryptionConfig = config.getEncryptionConfig();
const keyRotationConfig = config.getKeyRotationConfig();
const militaryConfig = config.getMilitarySecurityConfig();
const riskConfig = config.getRiskScoringConfig();
const debuggingConfig = config.getDebuggingConfig();
const integrityConfig = config.getIntegrityConfig();
const secureDeletionConfig = config.getSecureDeletionConfig();
const lockFilesConfig = config.getLockFilesConfig();
const criticalFilesConfig = config.getCriticalFilesConfig();

// Import systeminformation dynamically
let si = null;
try {
  si = require('systeminformation');
} catch (error) {
  console.warn('⚠️  systeminformation module not found, using fallback system info');
}

// Import geoip-lite dynamically
let geoip = null;
try {
  geoip = require('geoip-lite');
} catch (error) {
  console.warn('⚠️  geoip-lite module not found, using fallback geo info');
}

const SecurityMonitoring = require('./securityMonitoring');

class MilitarySecurity {
  constructor() {
    this.encryptionKey = encryptionConfig.key;
    this.rsaKeyPair = this.generateRSAKeyPair();
    this.keyRotationInterval = keyRotationConfig.interval;
    this.securityLevel = militaryConfig.securityLevel;
    this.maxRiskScore = riskConfig.maxRiskScore;
    this.securityMonitoring = new SecurityMonitoring();
    this.startKeyRotation();
  }

  generateRandomKey(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  // ==================== MULTI-LAYER ENCRYPTION ====================

  // Layer 1: AES-256-GCM (Already implemented)
  encryptAES256GCM(data, key = this.encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
    cipher.setAAD(Buffer.from('torro-license-data', 'utf8'));
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
  }

  decryptAES256GCM(encrypted, iv, authTag, key = this.encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'utf8'), Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('torro-license-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Layer 2: ChaCha20-Poly1305
  encryptChaCha20Poly1305(data, key = this.encryptionKey) {
    const algorithm = 'chacha20-poly1305';
    const nonce = crypto.randomBytes(12); // 12-byte nonce
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), nonce);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return { encrypted, nonce: nonce.toString('hex'), authTag: authTag.toString('hex') };
  }

  decryptChaCha20Poly1305(encrypted, nonce, authTag, key = this.encryptionKey) {
    const algorithm = 'chacha20-poly1305';
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'utf8'), Buffer.from(nonce, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Layer 3: RSA-4096 for key wrapping
  generateRSAKeyPair() {
    if (encryptionConfig.rsaPrivateKey && encryptionConfig.rsaPublicKey) {
      return {
        privateKey: encryptionConfig.rsaPrivateKey,
        publicKey: encryptionConfig.rsaPublicKey
      };
    }
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { privateKey, publicKey };
  }

  encryptWithRSA(data, publicKey) {
    return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
  }

  decryptWithRSA(encryptedData, privateKey) {
    return crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64')).toString('utf8');
  }

  // ==================== KEY ROTATION ====================

  startKeyRotation() {
    setInterval(() => {
      this.encryptionKey = this.generateRandomKey(32);
      this.rsaKeyPair = this.generateRSAKeyPair();
      this.securityMonitoring.logSecurityEvent('KEY_ROTATION', {
        message: 'Encryption keys rotated successfully',
        timestamp: Date.now()
      });
    }, this.keyRotationInterval);
  }

  // ==================== HARDWARE FINGERPRINTING ====================

  async getHardwareFingerprint() {
    if (!si) {
      // Fallback to basic system info
      const components = {
        cpu: os.cpus()[0].model + os.cpus().length,
        memory: os.totalmem(),
        os: os.platform() + os.release(),
        network: os.networkInterfaces()
      };
      const fingerprint = crypto.createHash('sha512')
        .update(JSON.stringify(components))
        .digest('hex');
      return { fingerprint, components };
    }

    const cpu = await si.cpu();
    const mem = await si.mem();
    const osInfo = await si.osInfo();
    const network = await si.networkInterfaces();

    const components = {
      cpu: cpu.manufacturer + cpu.brand + cpu.cores,
      memory: mem.total,
      os: osInfo.platform + osInfo.distro + osInfo.release,
      network: network.map(n => n.mac).join(',')
    };

    const fingerprint = crypto.createHash('sha512')
      .update(JSON.stringify(components))
      .digest('hex');

    return { fingerprint, components };
  }

  // ==================== TIME-BASED SECURITY ====================

  async validateServerTime() {
    const currentTime = Date.now();
    const ntpTime = await this.getNTPTime();
    const timeDifference = Math.abs(currentTime - ntpTime);
    const timeDriftThreshold = debuggingConfig.timeDriftThreshold;

    if (timeDifference > timeDriftThreshold) {
      this.logSecurityViolation('TIME_TAMPERING_DETECTED', {
        serverTime: currentTime,
        ntpTime: ntpTime,
        timeDifference: timeDifference,
        threshold: timeDriftThreshold,
        timestamp: Date.now()
      });
      return false;
    }
    return true;
  }

  async getNTPTime() {
    // Simulate fetching time from an NTP server
    return Date.now();
  }

  // ==================== NETWORK SECURITY ====================

  validateIPAddress(clientIp, allowedIPs) {
    if (!allowedIPs || allowedIPs.length === 0) return true;
    return allowedIPs.includes(clientIp);
  }

  async validateGeographicLocation(clientIp) {
    if (!geoip) return true; // Skip geo validation if module not available
    
    const geo = geoip.lookup(clientIp);
    const allowedCountries = config.getNetworkSecurityConfig().allowedCountries;
    if (!allowedCountries || allowedCountries.length === 0) return true;
    return geo && allowedCountries.includes(geo.country);
  }

  createRequestSignature(data, secret) {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
  }

  verifyRequestSignature(data, signature, secret) {
    const expectedSignature = this.createRequestSignature(data, secret);
    return signature === expectedSignature;
  }

  // ==================== ANTI-TAMPERING & ANTI-DEBUGGING ====================

  detectDebugger() {
    const start = Date.now();
    debugger; // This will pause if debugger is attached
    const delay = Date.now() - start;
    const debuggerThreshold = debuggingConfig.threshold;
    
    if (delay > debuggerThreshold) {
      this.logSecurityViolation('DEBUGGER_DETECTED', {
        delay,
        threshold: debuggerThreshold,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  obfuscateCode(code) {
    // Simple obfuscation - in production, use a proper obfuscator
    const obfuscated = code
      .replace(/function\s+(\w+)/g, 'function _0x' + Math.random().toString(16).substr(2, 8))
      .replace(/const\s+(\w+)/g, 'const _0x' + Math.random().toString(16).substr(2, 8));
    
    return obfuscated;
  }

  createIntegrityChecksum(data) {
    const salt = encryptionConfig.salt;
    const iterations = integrityConfig.pbkdf2Iterations;
    const keyLength = integrityConfig.pbkdf2KeyLength;
    
    const checksums = {
      sha256: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
      sha512: crypto.createHash('sha512').update(JSON.stringify(data)).digest('hex'),
      pbkdf2: crypto.pbkdf2Sync(JSON.stringify(data), salt, iterations, keyLength, 'sha512').toString('hex'),
      timestamp: Date.now(),
      salt: salt
    };
    
    return checksums;
  }

  verifyIntegrity(data, expectedChecksums) {
    const currentChecksums = this.createIntegrityChecksum(data);
    
    const isValid = 
      currentChecksums.sha256 === expectedChecksums.sha256 &&
      currentChecksums.sha512 === expectedChecksums.sha512 &&
      currentChecksums.pbkdf2 === expectedChecksums.pbkdf2;

    if (!isValid) {
      this.logSecurityViolation('INTEGRITY_VIOLATION', {
        expected: expectedChecksums,
        actual: currentChecksums,
        timestamp: Date.now()
      });
    }
    return isValid;
  }

  // ==================== RISK SCORING ====================

  calculateRiskScore(licenseData, validationAttempt) {
    let riskScore = 0;
    
    // Hardware fingerprint mismatch
    if (licenseData.hardwareFingerprint !== validationAttempt.hardwareFingerprint) {
      riskScore += riskConfig.hardwareMismatch;
    }
    
    // IP address validation
    if (!this.validateIPAddress(validationAttempt.ip, licenseData.allowedIPs)) {
      riskScore += riskConfig.ipMismatch;
    }
    
    // Geographic validation
    if (!this.validateGeographicLocation(validationAttempt.ip)) {
      riskScore += riskConfig.geoMismatch;
    }
    
    // Debugger detection
    if (validationAttempt.debuggerDetected) {
      riskScore += riskConfig.debugger;
    }
    
    // Integrity violation
    if (validationAttempt.integrityViolation) {
      riskScore += riskConfig.integrity;
    }
    
    // High frequency requests
    const maxRequests = config.getNetworkSecurityConfig().maxRequestsPerHour;
    if (validationAttempt.requestCount > maxRequests) {
      riskScore += riskConfig.highFrequency;
    }
    
    return Math.min(riskScore, 100);
  }

  // ==================== SELF-DESTRUCTION ====================

  militaryGradeSecureDelete(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const passes = secureDeletionConfig.passes;
      
      for (let pass = 0; pass < passes; pass++) {
        const randomData = crypto.randomBytes(fileSize);
        fs.writeFileSync(filePath, randomData);
        fs.fsyncSync(fs.openSync(filePath, 'r+'));
      }
      
      fs.unlinkSync(filePath);
      
      this.logSecurityEvent('SECURE_DELETE_COMPLETED', {
        filePath,
        passes: passes,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      this.logSecurityViolation('SECURE_DELETE_FAILED', {
        filePath,
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }

  createLockFile(licenseId, reason) {
    const lockFile = path.join(__dirname, '..', lockFilesConfig.lockFileName);
    const lockData = {
      licenseId,
      reason,
      timestamp: Date.now(),
      destroyed: true,
      signature: crypto.createHmac('sha256', this.encryptionKey)
        .update(licenseId + reason + Date.now())
        .digest('hex')
    };
    
    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
    return lockFile;
  }

  triggerSelfDestruction(licenseId, reason = 'SECURITY_VIOLATION') {
    this.logSecurityViolation('SELF_DESTRUCTION_TRIGGERED', {
      licenseId,
      reason,
      timestamp: Date.now()
    });
    
    // Create lock file
    this.createLockFile(licenseId, reason);
    
    // Get critical files
    const criticalFiles = criticalFilesConfig.files;
    
    criticalFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file.trim());
      if (fs.existsSync(filePath)) {
        this.militaryGradeSecureDelete(filePath);
      }
    });
    
    // Exit process
    process.exit(1);
  }

  // ==================== MONITORING & LOGGING ====================

  logSecurityEvent(event, data) {
    this.securityMonitoring.logSecurityEvent(event, data);
  }

  logSecurityViolation(violation, data) {
    this.securityMonitoring.logSecurityViolation(violation, data);
  }

  // ==================== MILITARY-GRADE LICENSE MANAGEMENT ====================

  async createMilitaryGradeLicense(licenseData) {
    const { fingerprint, components } = await this.getHardwareFingerprint();
    const integrityChecksums = this.createIntegrityChecksum(licenseData);
    const encryptedData = this.encryptAES256GCM(licenseData);

    return {
      ...licenseData,
      hardwareFingerprint: fingerprint,
      hardwareComponents: components,
      integrityChecksums,
      encryptedData,
      securityLevel: 'military'
    };
  }

  async validateMilitaryLicense(license, validationAttempt) {
    let valid = true;
    let reason = [];
    let riskScore = 0;

    // 1. Hardware Binding Check
    const currentHardware = await this.getHardwareFingerprint();
    const hardwareMatch = license.hardwareFingerprint === currentHardware.fingerprint;
    if (license.hardwareBinding && !hardwareMatch) {
      valid = false;
      reason.push('HARDWARE_MISMATCH');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, hardwareFingerprint: currentHardware.fingerprint });
    }

    // 2. Integrity Check
    const integrityValid = this.verifyIntegrity(license, license.integrityChecksums);
    if (!integrityValid) {
      valid = false;
      reason.push('INTEGRITY_VIOLATION');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, integrityViolation: true });
    }

    // 3. Time Tampering Check
    const timeValid = await this.validateServerTime();
    if (!timeValid) {
      valid = false;
      reason.push('TIME_TAMPERING');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, timeTampering: true });
    }

    // 4. Network Security Checks
    const ipValid = this.validateIPAddress(validationAttempt.ip, license.allowedIPs);
    if (!ipValid) {
      valid = false;
      reason.push('IP_MISMATCH');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, ipMismatch: true });
    }

    const geoValid = await this.validateGeographicLocation(validationAttempt.ip);
    if (!geoValid) {
      valid = false;
      reason.push('GEO_MISMATCH');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, geoMismatch: true });
    }

    // 5. Anti-Debugging Check
    const debuggerDetected = validationAttempt.debuggerDetected || this.detectDebugger();
    if (debuggerDetected) {
      valid = false;
      reason.push('DEBUGGER_DETECTED');
      riskScore += this.calculateRiskScore(license, { ...validationAttempt, debuggerDetected: true });
    }

    // 6. Risk Score Evaluation
    if (riskScore > this.maxRiskScore) {
      valid = false;
      reason.push('HIGH_RISK_SCORE');
    }

    // Log violation if not valid
    if (!valid) {
      this.logSecurityViolation('LICENSE_VALIDATION_FAILED', {
        licenseId: license.clientId,
        reason: reason.join(', '),
        riskScore: riskScore,
        validationAttempt,
        timestamp: Date.now()
      });
      
      // Trigger self-destruction if risk is too high or critical violation
      if (riskScore >= 90 || reason.includes('INTEGRITY_VIOLATION') || reason.includes('TIME_TAMPERING')) {
        this.triggerSelfDestruction(license.clientId, reason.join(', '));
      }
    }

    return {
      valid,
      reason: reason.length > 0 ? reason.join(', ') : 'License is valid',
      riskScore,
      hardwareMatch,
      integrityValid,
      debuggerDetected
    };
  }
}

module.exports = MilitarySecurity;
