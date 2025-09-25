const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class KeyRotationDaemon extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Daemon configuration
      sleepInterval: parseInt(process.env.KEY_DAEMON_SLEEP_INTERVAL) || 300000, // 5 minutes
      keyRotationInterval: parseInt(process.env.KEY_DAEMON_ROTATION_INTERVAL) || 3600000, // 1 hour
      keyStoragePath: process.env.KEY_STORAGE_PATH || path.join(__dirname, '..', '..', 'keys'),
      keyHistoryPath: process.env.KEY_HISTORY_PATH || path.join(__dirname, '..', '..', 'keys', 'history'),
      
      // Key generation configuration
      keyLength: parseInt(process.env.KEY_DAEMON_KEY_LENGTH) || 32,
      keyAlgorithm: process.env.KEY_DAEMON_ALGORITHM || 'sha256',
      keyDerivationRounds: parseInt(process.env.KEY_DAEMON_DERIVATION_ROUNDS) || 10000,
      
      // Security configuration
      maxKeyHistory: parseInt(process.env.KEY_DAEMON_MAX_HISTORY) || 100,
      keyValidationEnabled: process.env.KEY_DAEMON_VALIDATION_ENABLED !== 'false',
      keyIntegrityCheck: process.env.KEY_DAEMON_INTEGRITY_CHECK !== 'false',
      
      // Logging configuration
      logLevel: process.env.KEY_DAEMON_LOG_LEVEL || 'info',
      logFile: process.env.KEY_DAEMON_LOG_FILE || path.join(__dirname, '..', '..', 'logs', 'key-daemon.log'),
      
      ...options
    };
    
    this.isRunning = false;
    this.currentKey = null;
    this.keyHistory = [];
    this.keyIndex = 0;
    this.daemonProcess = null;
    this.keyRotationInterval = null;
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load existing key history
    this.loadKeyHistory();
    
    // Initialize current key
    this.initializeCurrentKey();
  }

  // ==================== DAEMON LIFECYCLE ====================

  async start() {
    if (this.isRunning) {
      this.log('warn', 'Key rotation daemon is already running');
      return;
    }

    this.isRunning = true;
    this.log('info', 'Starting key rotation daemon...');
    
    // Start the daemon loop
    this.daemonProcess = setInterval(async () => {
      await this.daemonCycle();
    }, this.options.sleepInterval);
    
    // Start key rotation
    this.startKeyRotation();
    
    this.emit('started');
    this.log('info', 'Key rotation daemon started successfully');
  }

  async stop() {
    if (!this.isRunning) {
      this.log('warn', 'Key rotation daemon is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.daemonProcess) {
      clearInterval(this.daemonProcess);
      this.daemonProcess = null;
    }
    
    if (this.keyRotationInterval) {
      clearInterval(this.keyRotationInterval);
      this.keyRotationInterval = null;
    }
    
    // Save current state
    await this.saveKeyHistory();
    
    this.emit('stopped');
    this.log('info', 'Key rotation daemon stopped');
  }

  // ==================== DAEMON CYCLE ====================

  async daemonCycle() {
    try {
      this.log('debug', 'Daemon cycle started');
      
      // Generate new key based on previous key
      const newKey = await this.generateNextKey();
      
      // Validate the new key
      if (this.options.keyValidationEnabled) {
        const isValid = await this.validateKey(newKey);
        if (!isValid) {
          this.log('error', 'Generated key failed validation');
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
      
      // Emit key rotation event
      this.emit('keyRotated', {
        key: newKey,
        index: this.keyIndex,
        timestamp: Date.now()
      });
      
      this.log('info', `Key rotated successfully (index: ${this.keyIndex})`);
      
    } catch (error) {
      this.log('error', `Daemon cycle error: ${error.message}`);
      this.emit('error', error);
    }
  }

  // ==================== KEY GENERATION ====================

  async generateNextKey() {
    let baseKey;
    
    if (this.currentKey) {
      // Generate new key based on previous key
      baseKey = this.deriveKeyFromPrevious(this.currentKey);
    } else {
      // Generate initial key
      baseKey = this.generateInitialKey();
    }
    
    // Apply additional entropy
    const entropy = crypto.randomBytes(this.options.keyLength);
    const combinedKey = Buffer.concat([baseKey, entropy]);
    
    // Hash the combined key
    const hashedKey = crypto.createHash(this.options.keyAlgorithm)
      .update(combinedKey)
      .digest();
    
    return hashedKey.toString('hex');
  }

  deriveKeyFromPrevious(previousKey) {
    // Use PBKDF2 to derive new key from previous key
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(
      previousKey,
      salt,
      this.options.keyDerivationRounds,
      this.options.keyLength,
      this.options.keyAlgorithm
    );
    
    return derivedKey;
  }

  generateInitialKey() {
    // Generate initial key using system entropy
    return crypto.randomBytes(this.options.keyLength);
  }

  // ==================== KEY VALIDATION ====================

  async validateKey(key) {
    try {
      // Check key length
      if (key.length !== this.options.keyLength * 2) { // *2 for hex string
        this.log('warn', `Key length mismatch: expected ${this.options.keyLength * 2}, got ${key.length}`);
        return false;
      }
      
      // Check key format (hex)
      if (!/^[a-f0-9]+$/i.test(key)) {
        this.log('warn', 'Key contains non-hex characters');
        return false;
      }
      
      // Check for key uniqueness
      if (this.keyHistory.includes(key)) {
        this.log('warn', 'Generated key already exists in history');
        return false;
      }
      
      // Check key entropy (basic check)
      const entropy = this.calculateEntropy(key);
      if (entropy < 3.0) { // Minimum entropy threshold
        this.log('warn', `Key entropy too low: ${entropy}`);
        return false;
      }
      
      return true;
    } catch (error) {
      this.log('error', `Key validation error: ${error.message}`);
      return false;
    }
  }

  calculateEntropy(key) {
    // Simple entropy calculation
    const charCounts = {};
    for (const char of key) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = key.length;
    
    for (const count of Object.values(charCounts)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  // ==================== KEY STORAGE ====================

  async storeKey(key) {
    try {
      const keyData = {
        key,
        index: this.keyIndex,
        timestamp: Date.now(),
        algorithm: this.options.keyAlgorithm,
        length: this.options.keyLength,
        derivedFrom: this.currentKey ? this.keyIndex - 1 : null
      };
      
      // Store current key
      const currentKeyPath = path.join(this.options.keyStoragePath, 'current.json');
      await fs.promises.writeFile(currentKeyPath, JSON.stringify(keyData, null, 2));
      
      // Store key in history
      const historyKeyPath = path.join(this.options.keyHistoryPath, `key-${this.keyIndex}.json`);
      await fs.promises.writeFile(historyKeyPath, JSON.stringify(keyData, null, 2));
      
      this.log('debug', `Key stored: ${currentKeyPath}`);
      
    } catch (error) {
      this.log('error', `Key storage error: ${error.message}`);
      throw error;
    }
  }

  async loadCurrentKey() {
    try {
      const currentKeyPath = path.join(this.options.keyStoragePath, 'current.json');
      if (fs.existsSync(currentKeyPath)) {
        const keyData = JSON.parse(await fs.promises.readFile(currentKeyPath, 'utf8'));
        this.currentKey = keyData.key;
        this.keyIndex = keyData.index;
        return keyData;
      }
    } catch (error) {
      this.log('error', `Error loading current key: ${error.message}`);
    }
    return null;
  }

  // ==================== KEY HISTORY ====================

  addToHistory(key) {
    const keyEntry = {
      key,
      index: this.keyIndex,
      timestamp: Date.now(),
      algorithm: this.options.keyAlgorithm,
      length: this.options.keyLength
    };
    
    this.keyHistory.push(keyEntry);
    
    // Maintain history size limit
    if (this.keyHistory.length > this.options.maxKeyHistory) {
      this.keyHistory = this.keyHistory.slice(-this.options.maxKeyHistory);
    }
  }

  async loadKeyHistory() {
    try {
      if (!fs.existsSync(this.options.keyHistoryPath)) {
        return;
      }
      
      const files = await fs.promises.readdir(this.options.keyHistoryPath);
      const keyFiles = files.filter(file => file.startsWith('key-') && file.endsWith('.json'));
      
      this.keyHistory = [];
      for (const file of keyFiles) {
        try {
          const keyData = JSON.parse(
            await fs.promises.readFile(path.join(this.options.keyHistoryPath, file), 'utf8')
          );
          this.keyHistory.push(keyData);
        } catch (error) {
          this.log('warn', `Error loading key file ${file}: ${error.message}`);
        }
      }
      
      // Sort by index
      this.keyHistory.sort((a, b) => a.index - b.index);
      
      this.log('info', `Loaded ${this.keyHistory.length} keys from history`);
      
    } catch (error) {
      this.log('error', `Error loading key history: ${error.message}`);
    }
  }

  async saveKeyHistory() {
    try {
      const historyData = {
        keys: this.keyHistory,
        lastUpdated: Date.now(),
        totalKeys: this.keyIndex
      };
      
      const historyPath = path.join(this.options.keyStoragePath, 'history.json');
      await fs.promises.writeFile(historyPath, JSON.stringify(historyData, null, 2));
      
    } catch (error) {
      this.log('error', `Error saving key history: ${error.message}`);
    }
  }

  // ==================== KEY ROTATION ====================

  startKeyRotation() {
    this.keyRotationInterval = setInterval(async () => {
      await this.daemonCycle();
    }, this.options.keyRotationInterval);
    
    this.log('info', `Key rotation started (interval: ${this.options.keyRotationInterval}ms)`);
  }

  // ==================== KEY RETRIEVAL ====================

  getCurrentKey() {
    return this.currentKey;
  }

  getKeyByIndex(index) {
    return this.keyHistory.find(key => key.index === index);
  }

  getKeyHistory() {
    return [...this.keyHistory];
  }

  getKeyStats() {
    return {
      currentKey: this.currentKey,
      keyIndex: this.keyIndex,
      historySize: this.keyHistory.length,
      isRunning: this.isRunning,
      lastRotation: this.keyHistory.length > 0 ? this.keyHistory[this.keyHistory.length - 1].timestamp : null
    };
  }

  // ==================== UTILITIES ====================

  ensureDirectories() {
    const dirs = [
      this.options.keyStoragePath,
      this.options.keyHistoryPath,
      path.dirname(this.options.logFile)
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async initializeCurrentKey() {
    const currentKeyData = await this.loadCurrentKey();
    if (currentKeyData) {
      this.currentKey = currentKeyData.key;
      this.keyIndex = currentKeyData.index;
      this.log('info', `Loaded current key (index: ${this.keyIndex})`);
    } else {
      this.log('info', 'No current key found, will generate initial key');
    }
  }

  // ==================== LOGGING ====================

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
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

  // ==================== PUBLIC API ====================

  async getStatus() {
    return {
      isRunning: this.isRunning,
      currentKey: this.currentKey ? this.currentKey.substring(0, 8) + '...' : null,
      keyIndex: this.keyIndex,
      historySize: this.keyHistory.length,
      nextRotation: this.isRunning ? Date.now() + this.options.keyRotationInterval : null,
      config: {
        sleepInterval: this.options.sleepInterval,
        keyRotationInterval: this.options.keyRotationInterval,
        keyLength: this.options.keyLength,
        algorithm: this.options.keyAlgorithm
      }
    };
  }

  async forceKeyRotation() {
    if (!this.isRunning) {
      throw new Error('Daemon is not running');
    }
    
    this.log('info', 'Forcing key rotation...');
    await this.daemonCycle();
  }

  async reset() {
    await this.stop();
    
    // Clear history
    this.keyHistory = [];
    this.keyIndex = 0;
    this.currentKey = null;
    
    // Clear storage
    try {
      if (fs.existsSync(this.options.keyStoragePath)) {
        const files = await fs.promises.readdir(this.options.keyStoragePath);
        for (const file of files) {
          await fs.promises.unlink(path.join(this.options.keyStoragePath, file));
        }
      }
    } catch (error) {
      this.log('error', `Error clearing storage: ${error.message}`);
    }
    
    this.log('info', 'Key rotation daemon reset');
  }
}

module.exports = KeyRotationDaemon;
