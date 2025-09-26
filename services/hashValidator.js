const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const DynamicConfig = require('../utils/dynamicConfig');

// Load dynamic configuration
const config = new DynamicConfig();

// Get configurations
const hashConfig = config.getHashValidationConfig();
const storageConfig = config.getStorageConfig();

// Import systeminformation dynamically
let si = null;
try {
  si = require('systeminformation');
} catch (error) {
  console.warn('⚠️  systeminformation module not found, using fallback system info');
}

class HashValidator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Hash validation configuration
      hashAlgorithm: hashConfig.algorithm,
      hashSalt: hashConfig.salt,
      hashIterations: hashConfig.iterations,
      hashLength: hashConfig.length,
      
      // Password change configuration
      passwordChangeOnMismatch: hashConfig.passwordChangeOnMismatch,
      passwordLength: hashConfig.passwordLength,
      passwordComplexity: hashConfig.passwordComplexity,
      
      // Validation intervals
      validationInterval: hashConfig.interval,
      maxMismatchAttempts: hashConfig.maxMismatchAttempts,
      
      // Storage paths
      hashStoragePath: storageConfig.hashStoragePath,
      passwordStoragePath: storageConfig.passwordStoragePath,
      
      // Security settings
      enableHashRotation: hashConfig.hashRotationEnabled,
      hashRotationInterval: hashConfig.hashRotationInterval,
      
      ...options
    };
    
    this.currentHash = null;
    this.currentPassword = null;
    this.mismatchCount = 0;
    this.lastValidation = null;
    this.validationInterval = null;
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load current hash and password
    this.loadCurrentHash();
    this.loadCurrentPassword();
  }

  // ==================== HASH VALIDATION ====================

  async startValidation() {
    console.log('🔐 Starting hash validation system...');
    
    // Start periodic validation
    this.validationInterval = setInterval(async () => {
      await this.performValidation();
    }, this.options.validationInterval);
    
    // Initial validation
    await this.performValidation();
    
    console.log('✅ Hash validation system started');
  }

  async stopValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    console.log('🛑 Hash validation system stopped');
  }

  async performValidation() {
    try {
      console.log('🔍 Performing hash validation...');
      
      // Generate current hash from system state
      const currentSystemHash = await this.generateSystemHash();
      
      // Load stored hash
      const storedHash = await this.loadStoredHash();
      
      if (!storedHash) {
        console.log('⚠️  No stored hash found, creating initial hash');
        await this.createInitialHash(currentSystemHash);
        return;
      }
      
      // Compare hashes
      const isValid = this.compareHashes(currentSystemHash, storedHash);
      
      if (isValid) {
        console.log('✅ Hash validation passed');
        this.mismatchCount = 0;
        this.lastValidation = {
          timestamp: Date.now(),
          result: 'PASS',
          hash: currentSystemHash.substring(0, 16) + '...'
        };
      } else {
        console.log('❌ Hash validation failed - mismatch detected');
        this.mismatchCount++;
        
        this.lastValidation = {
          timestamp: Date.now(),
          result: 'FAIL',
          hash: currentSystemHash.substring(0, 16) + '...',
          storedHash: storedHash.substring(0, 16) + '...',
          mismatchCount: this.mismatchCount
        };
        
        // Log security violation
        this.logSecurityViolation('HASH_MISMATCH', {
          currentHash: currentSystemHash.substring(0, 16) + '...',
          storedHash: storedHash.substring(0, 16) + '...',
          mismatchCount: this.mismatchCount,
          timestamp: Date.now()
        });
        
        // Change password if mismatch threshold reached
        if (this.mismatchCount >= this.options.maxMismatchAttempts) {
          await this.changePassword();
          this.mismatchCount = 0;
        }
      }
      
    } catch (error) {
      console.error('❌ Hash validation error:', error.message);
      this.logSecurityViolation('HASH_VALIDATION_ERROR', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  // ==================== HASH GENERATION ====================

  async generateSystemHash() {
    try {
      // Collect system information for hashing
      const systemInfo = await this.collectSystemInfo();
      
      // Create hash from system info
      const hashInput = JSON.stringify(systemInfo);
      const hash = crypto.pbkdf2Sync(
        hashInput,
        this.options.hashSalt,
        this.options.hashIterations,
        this.options.hashLength,
        this.options.hashAlgorithm
      );
      
      return hash.toString('hex');
    } catch (error) {
      console.error('❌ Error generating system hash:', error.message);
      throw error;
    }
  }

  async collectSystemInfo() {
    const os = require('os');

    const buildStableNetwork = (ifaces) => {
      // Only include MAC addresses (stable), exclude IPs which change often
      const macs = (ifaces || [])
        .map(n => n.mac)
        .filter(Boolean)
        .sort();
      return macs;
    };

    const buildStableDisks = (disks) => {
      // Include type and size; sort to ensure deterministic order
      return (disks || [])
        .map(d => ({ type: d.type, size: d.size }))
        .sort((a, b) => (a.type + a.size).localeCompare(b.type + b.size));
    };

    try {
      if (!si) {
        // Minimal stable fallback (no volatile fields like uptime/timestamp)
        return {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          cpuCount: os.cpus().length,
          memoryTotal: os.totalmem()
        };
      }

      const [cpu, mem, network, disk] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.networkInterfaces(),
        si.diskLayout()
      ]);

      return {
        // Stable system information (exclude uptime/timestamp)
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),

        // Stable hardware information only
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores
        },
        memory: {
          total: mem.total
        },
        networkMacs: buildStableNetwork(network),
        disks: buildStableDisks(disk),

        // Stable process info (exclude pid)
        node: {
          version: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      console.error('❌ Error collecting system info:', error.message);
      // Minimal stable fallback
      return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname()
      };
    }
  }

  // ==================== HASH STORAGE ====================

  async createInitialHash(systemHash) {
    try {
      const hashData = {
        hash: systemHash,
        algorithm: this.options.hashAlgorithm,
        salt: this.options.hashSalt,
        iterations: this.options.hashIterations,
        length: this.options.hashLength,
        createdAt: Date.now(),
        version: '1.0.0'
      };
      
      const hashPath = path.join(this.options.hashStoragePath, 'current.json');
      await fs.promises.writeFile(hashPath, JSON.stringify(hashData, null, 2));
      
      this.currentHash = systemHash;
      console.log('✅ Initial hash created and stored');
      
    } catch (error) {
      console.error('❌ Error creating initial hash:', error.message);
      throw error;
    }
  }

  async loadStoredHash() {
    try {
      const hashPath = path.join(this.options.hashStoragePath, 'current.json');
      
      if (fs.existsSync(hashPath)) {
        const hashData = JSON.parse(await fs.promises.readFile(hashPath, 'utf8'));
        this.currentHash = hashData.hash;
        return hashData.hash;
      }
    } catch (error) {
      console.error('❌ Error loading stored hash:', error.message);
    }
    
    return null;
  }

  async updateStoredHash(newHash) {
    try {
      const hashData = {
        hash: newHash,
        algorithm: this.options.hashAlgorithm,
        salt: this.options.hashSalt,
        iterations: this.options.hashIterations,
        length: this.options.hashLength,
        updatedAt: Date.now(),
        version: '1.0.0'
      };
      
      const hashPath = path.join(this.options.hashStoragePath, 'current.json');
      await fs.promises.writeFile(hashPath, JSON.stringify(hashData, null, 2));
      
      this.currentHash = newHash;
      console.log('✅ Hash updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating stored hash:', error.message);
      throw error;
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async changePassword() {
    try {
      console.log('🔑 Changing password due to hash mismatch...');
      
      // Generate new password
      const newPassword = this.generateSecurePassword();
      
      // Hash the new password
      const hashedPassword = this.hashPassword(newPassword);
      
      // Store new password
      await this.storePassword(hashedPassword);
      
      // Update system with new password
      await this.updateSystemPassword(newPassword);
      
      // Log password change
      this.logSecurityEvent('PASSWORD_CHANGED', {
        reason: 'HASH_MISMATCH',
        timestamp: Date.now(),
        mismatchCount: this.mismatchCount
      });
      
      console.log('✅ Password changed successfully');
      
    } catch (error) {
      console.error('❌ Error changing password:', error.message);
      throw error;
    }
  }

  generateSecurePassword() {
    const length = this.options.passwordLength;
    const complexity = this.options.passwordComplexity;
    const charsets = this.options.passwordCharsets || {};
    
    let charset = '';
    
    switch (complexity) {
      case 'high':
        charset = charsets.high || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        break;
      case 'medium':
        charset = charsets.medium || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        break;
      case 'low':
        charset = charsets.low || 'abcdefghijklmnopqrstuvwxyz0123456789';
        break;
      default:
        charset = charsets.high || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.options.hashIterations,
      this.options.hashLength,
      this.options.hashAlgorithm
    );
    
    return {
      hash: hash.toString('hex'),
      salt: salt,
      algorithm: this.options.hashAlgorithm,
      iterations: this.options.hashIterations,
      length: this.options.hashLength
    };
  }

  async storePassword(hashedPassword) {
    try {
      const passwordData = {
        ...hashedPassword,
        createdAt: Date.now(),
        version: '1.0.0'
      };
      
      const passwordPath = path.join(this.options.passwordStoragePath, 'current.json');
      await fs.promises.writeFile(passwordPath, JSON.stringify(passwordData, null, 2));
      
      this.currentPassword = hashedPassword;
      console.log('✅ Password stored successfully');
      
    } catch (error) {
      console.error('❌ Error storing password:', error.message);
      throw error;
    }
  }

  async loadCurrentPassword() {
    try {
      const passwordPath = path.join(this.options.passwordStoragePath, 'current.json');
      
      if (fs.existsSync(passwordPath)) {
        const passwordData = JSON.parse(await fs.promises.readFile(passwordPath, 'utf8'));
        this.currentPassword = passwordData;
        return passwordData;
      }
    } catch (error) {
      console.error('❌ Error loading current password:', error.message);
    }
    
    return null;
  }

  async updateSystemPassword(newPassword) {
    try {
      // Update environment variables
      process.env.TORRO_DAEMON_PASSWORD = newPassword;
      
      // Update configuration files if needed
      const configPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(configPath)) {
        let envContent = await fs.promises.readFile(configPath, 'utf8');
        
        // Update or add password
        if (envContent.includes('TORRO_DAEMON_PASSWORD=')) {
          envContent = envContent.replace(
            /TORRO_DAEMON_PASSWORD=.*/,
            `TORRO_DAEMON_PASSWORD=${newPassword}`
          );
        } else {
          envContent += `\nTORRO_DAEMON_PASSWORD=${newPassword}\n`;
        }
        
        await fs.promises.writeFile(configPath, envContent);
      }
      
      console.log('✅ System password updated');
      
    } catch (error) {
      console.error('❌ Error updating system password:', error.message);
      throw error;
    }
  }

  // ==================== HASH COMPARISON ====================

  compareHashes(hash1, hash2) {
    // Use constant-time comparison to prevent timing attacks
    if (hash1.length !== hash2.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    
    return result === 0;
  }

  // ==================== UTILITIES ====================

  ensureDirectories() {
    const dirs = [
      this.options.hashStoragePath,
      this.options.passwordStoragePath
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  // ==================== HASH LOADING ====================

  async loadCurrentHash() {
    try {
      const hashData = await this.loadStoredHash();
      if (hashData) {
        this.currentHash = hashData;
        console.log('✅ Current hash loaded');
      } else {
        console.log('⚠️  No current hash found');
      }
    } catch (error) {
      console.error('❌ Error loading current hash:', error.message);
    }
  }

  // ==================== LOGGING ====================

  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event,
      data
    };
    
    console.log(`[SECURITY EVENT] ${event}:`, data);
    
    // Write to log file
    const logPath = path.join(__dirname, '..', 'logs', 'hash-validation.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  logSecurityViolation(violation, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      violation,
      data
    };
    
    console.error(`[SECURITY VIOLATION] ${violation}:`, data);
    
    // Write to log file
    const logPath = path.join(__dirname, '..', 'logs', 'hash-validation.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  // ==================== PUBLIC API ====================

  async getStatus() {
    return {
      isRunning: this.validationInterval !== null,
      currentHash: this.currentHash ? this.currentHash.substring(0, 16) + '...' : null,
      currentPassword: this.currentPassword ? '***' : null,
      mismatchCount: this.mismatchCount,
      lastValidation: this.lastValidation,
      config: {
        algorithm: this.options.hashAlgorithm,
        iterations: this.options.hashIterations,
        validationInterval: this.options.validationInterval,
        maxMismatchAttempts: this.options.maxMismatchAttempts
      }
    };
  }

  async forceValidation() {
    await this.performValidation();
  }

  async forcePasswordChange() {
    await this.changePassword();
  }
}

module.exports = HashValidator;
