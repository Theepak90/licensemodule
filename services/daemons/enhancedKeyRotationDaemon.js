const KeyRotationDaemon = require('./keyRotationDaemon');
const HashValidator = require('../hashValidator');
const EventEmitter = require('events');

class EnhancedKeyRotationDaemon extends KeyRotationDaemon {
  constructor(options = {}) {
    super(options);
    
    // Initialize hash validator
    this.hashValidator = new HashValidator({
      validationInterval: parseInt(process.env.HASH_VALIDATION_INTERVAL) || 30000,
      passwordChangeOnMismatch: process.env.PASSWORD_CHANGE_ON_MISMATCH !== 'false',
      maxMismatchAttempts: parseInt(process.env.MAX_MISMATCH_ATTEMPTS) || 3,
      ...options
    });
    
    this.isHashValidationEnabled = process.env.ENABLE_HASH_VALIDATION !== 'false';
    this.hashValidationRunning = false;
  }

  // ==================== ENHANCED DAEMON LIFECYCLE ====================

  async start() {
    if (this.isRunning) {
      this.log('warn', 'Enhanced key rotation daemon is already running');
      return;
    }

    this.isRunning = true;
    this.log('info', 'Starting enhanced key rotation daemon...');
    
    // Start base daemon
    await super.start();
    
    // Start hash validation if enabled
    if (this.isHashValidationEnabled) {
      await this.startHashValidation();
    }
    
    this.emit('started');
    this.log('info', 'Enhanced key rotation daemon started successfully');
  }

  async stop() {
    if (!this.isRunning) {
      this.log('warn', 'Enhanced key rotation daemon is not running');
      return;
    }

    this.isRunning = false;
    
    // Stop hash validation
    if (this.hashValidationRunning) {
      await this.stopHashValidation();
    }
    
    // Stop base daemon
    await super.stop();
    
    this.emit('stopped');
    this.log('info', 'Enhanced key rotation daemon stopped');
  }

  // ==================== HASH VALIDATION INTEGRATION ====================

  async startHashValidation() {
    try {
      await this.hashValidator.startValidation();
      this.hashValidationRunning = true;
      
      // Set up hash validation event listeners
      this.hashValidator.on('hashMismatch', (data) => {
        this.log('warn', `Hash mismatch detected: ${data.mismatchCount}/${this.hashValidator.options.maxMismatchAttempts}`);
        this.emit('hashMismatch', data);
      });
      
      this.hashValidator.on('passwordChanged', (data) => {
        this.log('info', 'Password changed due to hash mismatch');
        this.emit('passwordChanged', data);
      });
      
      this.log('info', 'Hash validation started');
      
    } catch (error) {
      this.log('error', `Failed to start hash validation: ${error.message}`);
      throw error;
    }
  }

  async stopHashValidation() {
    try {
      await this.hashValidator.stopValidation();
      this.hashValidationRunning = false;
      this.log('info', 'Hash validation stopped');
    } catch (error) {
      this.log('error', `Error stopping hash validation: ${error.message}`);
    }
  }

  // ==================== ENHANCED KEY GENERATION ====================

  async generateNextKey() {
    try {
      // Perform hash validation before key generation
      if (this.isHashValidationEnabled && this.hashValidationRunning) {
        await this.hashValidator.performValidation();
      }
      
      // Generate key using base method
      const key = await super.generateNextKey();
      
      // Update hash after successful key generation
      if (this.isHashValidationEnabled && this.hashValidationRunning) {
        const newSystemHash = await this.hashValidator.generateSystemHash();
        await this.hashValidator.updateStoredHash(newSystemHash);
      }
      
      return key;
      
    } catch (error) {
      this.log('error', `Enhanced key generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== ENHANCED VALIDATION ====================

  async validateKey(key) {
    try {
      // Perform base validation
      const baseValidation = await super.validateKey(key);
      
      if (!baseValidation) {
        return false;
      }
      
      // Perform hash validation if enabled
      if (this.isHashValidationEnabled && this.hashValidationRunning) {
        const hashValidation = await this.hashValidator.performValidation();
        
        if (!hashValidation) {
          this.log('warn', 'Key validation failed due to hash mismatch');
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      this.log('error', `Enhanced key validation failed: ${error.message}`);
      return false;
    }
  }

  // ==================== ENHANCED DAEMON CYCLE ====================

  async daemonCycle() {
    try {
      this.log('debug', 'Enhanced daemon cycle started');
      
      // Perform hash validation
      if (this.isHashValidationEnabled && this.hashValidationRunning) {
        await this.hashValidator.performValidation();
      }
      
      // Generate new key
      const newKey = await this.generateNextKey();
      
      // Validate the new key
      if (this.options.keyValidationEnabled) {
        const isValid = await this.validateKey(newKey);
        if (!isValid) {
          this.log('error', 'Generated key failed enhanced validation');
          return;
        }
      }
      
      // Store the new key
      await this.storeKey(newKey);
      
      // Update current key
      this.currentKey = newKey;
      this.keyIndex++;
      
      // Add to history
      this.addToHistory(newKey);
      
      // Emit key rotation event with hash validation status
      this.emit('keyRotated', {
        key: newKey,
        index: this.keyIndex,
        timestamp: Date.now(),
        hashValidationEnabled: this.isHashValidationEnabled,
        hashValidationRunning: this.hashValidationRunning
      });
      
      this.log('info', `Enhanced key rotated successfully (index: ${this.keyIndex})`);
      
    } catch (error) {
      this.log('error', `Enhanced daemon cycle error: ${error.message}`);
      this.emit('error', error);
    }
  }

  // ==================== ENHANCED STATUS ====================

  async getStatus() {
    const baseStatus = await super.getStatus();
    const hashStatus = await this.hashValidator.getStatus();
    
    return {
      ...baseStatus,
      hashValidation: {
        enabled: this.isHashValidationEnabled,
        running: this.hashValidationRunning,
        ...hashStatus
      }
    };
  }

  // ==================== HASH VALIDATION CONTROL ====================

  async enableHashValidation() {
    if (!this.hashValidationRunning) {
      await this.startHashValidation();
      this.log('info', 'Hash validation enabled');
    }
  }

  async disableHashValidation() {
    if (this.hashValidationRunning) {
      await this.stopHashValidation();
      this.log('info', 'Hash validation disabled');
    }
  }

  async forceHashValidation() {
    if (this.isHashValidationEnabled && this.hashValidationRunning) {
      await this.hashValidator.forceValidation();
    }
  }

  async forcePasswordChange() {
    if (this.isHashValidationEnabled && this.hashValidationRunning) {
      await this.hashValidator.forcePasswordChange();
    }
  }

  // ==================== ENHANCED LOGGING ====================

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] [ENHANCED] ${message}\n`;
    
    // Console output
    if (this.options.logLevel === 'debug' || level === 'error' || level === 'warn') {
      console.log(logEntry.trim());
    }
    
    // File output
    try {
      fs.appendFileSync(this.options.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
}

module.exports = EnhancedKeyRotationDaemon;
