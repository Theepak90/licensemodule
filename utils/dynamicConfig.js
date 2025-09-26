const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DynamicConfig {
  constructor() {
    this.config = {};
    this.loadConfig();
  }

  loadConfig() {
    // Load from .env file
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key] = value;
          }
        }
      }
    }

    // Set default values for all configuration
    this.setDefaults();
  }

  setDefaults() {
    // Server Configuration - NEW PORTS: Backend 3005, Frontend 3004
    this.config.server = {
      port: parseInt(process.env.PORT) || 3005,
      host: process.env.HOST || 'localhost',
      nodeEnv: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3004'],
      corsCredentials: process.env.CORS_CREDENTIALS === 'true',
      corsMethods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      corsHeaders: process.env.CORS_HEADERS ? process.env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization', 'X-Requested-With'],
      jsonLimit: process.env.JSON_LIMIT || '10mb'
    };

    // Database Configuration
    this.config.database = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/torro_licenses',
      name: process.env.DB_NAME || 'torro_licenses'
    };

    // JWT Configuration
    this.config.jwt = {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };

    // Encryption Configuration
    this.config.encryption = {
      key: process.env.LICENSE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
      salt: process.env.LICENSE_SALT || 'military-grade-salt-2024',
      rsaPrivateKey: process.env.RSA_PRIVATE_KEY || null,
      rsaPublicKey: process.env.RSA_PUBLIC_KEY || null
    };

    // Military Security Configuration - FORCE ALL SECURITY FEATURES ON
    this.config.militarySecurity = {
      enabled: process.env.MILITARY_SECURITY_ENABLED !== 'false', // Default to true
      hardwareBindingRequired: process.env.HARDWARE_BINDING_REQUIRED !== 'false', // Default to true
      antiTamperingEnabled: process.env.ANTI_TAMPERING_ENABLED !== 'false', // Default to true
      selfDestructionEnabled: process.env.SELF_DESTRUCTION_ENABLED !== 'false', // Default to true
      securityLevel: process.env.SECURITY_LEVEL || 'military'
    };

    // Key Rotation Configuration
    this.config.keyRotation = {
      interval: parseInt(process.env.KEY_ROTATION_INTERVAL) || 3600000,
      sleepInterval: parseInt(process.env.KEY_DAEMON_SLEEP_INTERVAL) || 300000,
      keyLength: parseInt(process.env.KEY_DAEMON_KEY_LENGTH) || 32,
      algorithm: process.env.KEY_DAEMON_ALGORITHM || 'sha256',
      derivationRounds: parseInt(process.env.KEY_DAEMON_DERIVATION_ROUNDS) || 10000,
      maxHistory: parseInt(process.env.KEY_DAEMON_MAX_HISTORY) || 100,
      validationEnabled: process.env.KEY_DAEMON_VALIDATION_ENABLED !== 'false',
      integrityCheck: process.env.KEY_DAEMON_INTEGRITY_CHECK !== 'false'
    };

    // Hash Validation Configuration
    this.config.hashValidation = {
      enabled: process.env.ENABLE_HASH_VALIDATION !== 'false',
      algorithm: process.env.HASH_VALIDATION_ALGORITHM || 'sha256',
      salt: process.env.HASH_VALIDATION_SALT || 'torro-hash-salt-2024',
      iterations: parseInt(process.env.HASH_VALIDATION_ITERATIONS) || 10000,
      length: parseInt(process.env.HASH_VALIDATION_LENGTH) || 64,
      interval: parseInt(process.env.HASH_VALIDATION_INTERVAL) || 30000,
      maxMismatchAttempts: parseInt(process.env.MAX_MISMATCH_ATTEMPTS) || 3,
      passwordChangeOnMismatch: process.env.PASSWORD_CHANGE_ON_MISMATCH !== 'false',
      passwordLength: parseInt(process.env.PASSWORD_LENGTH) || 32,
      passwordComplexity: process.env.PASSWORD_COMPLEXITY || 'high',
      passwordCharsets: {
        high: process.env.PASSWORD_CHARSET_HIGH || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
        medium: process.env.PASSWORD_CHARSET_MEDIUM || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        low: process.env.PASSWORD_CHARSET_LOW || 'abcdefghijklmnopqrstuvwxyz0123456789'
      },
      hashRotationEnabled: process.env.ENABLE_HASH_ROTATION !== 'false',
      hashRotationInterval: parseInt(process.env.HASH_ROTATION_INTERVAL) || 3600000
    };

    // License Configuration
    this.config.license = {
      keyPrefix: process.env.LICENSE_KEY_PREFIX || 'TORRO',
      randomLength: parseInt(process.env.LICENSE_RANDOM_LENGTH) || 16,
      checksumLength: parseInt(process.env.LICENSE_CHECKSUM_LENGTH) || 8,
      clientIdPrefix: process.env.CLIENT_ID_PREFIX || 'TORRO',
      clientIdSuffixLength: parseInt(process.env.CLIENT_ID_SUFFIX_LENGTH) || 9
    };

    // Network Security Configuration
    this.config.networkSecurity = {
      allowedCountries: process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',') : ['US', 'CA', 'GB', 'DE', 'FR'],
      maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 1000,
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      rateLimitMessage: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.'
    };

    // Risk Scoring Configuration
    this.config.riskScoring = {
      hardwareMismatch: parseInt(process.env.RISK_WEIGHT_HARDWARE_MISMATCH) || 30,
      ipMismatch: parseInt(process.env.RISK_WEIGHT_IP_MISMATCH) || 25,
      geoMismatch: parseInt(process.env.RISK_WEIGHT_GEO_MISMATCH) || 20,
      debugger: parseInt(process.env.RISK_WEIGHT_DEBUGGER) || 40,
      integrity: parseInt(process.env.RISK_WEIGHT_INTEGRITY) || 50,
      highFrequency: parseInt(process.env.RISK_WEIGHT_HIGH_FREQUENCY) || 15,
      maxRiskScore: parseInt(process.env.MAX_RISK_SCORE) || 80
    };

    // Debugging Configuration
    this.config.debugging = {
      threshold: parseInt(process.env.DEBUGGER_THRESHOLD) || 100,
      timeDriftThreshold: parseInt(process.env.TIME_DRIFT_THRESHOLD) || 5000
    };

    // Integrity Checking Configuration
    this.config.integrity = {
      pbkdf2Iterations: parseInt(process.env.PBKDF2_ITERATIONS) || 10000,
      pbkdf2KeyLength: parseInt(process.env.PBKDF2_KEY_LENGTH) || 64
    };

    // Secure Deletion Configuration
    this.config.secureDeletion = {
      passes: parseInt(process.env.SECURE_DELETE_PASSES) || 7
    };

    // Lock Files Configuration
    this.config.lockFiles = {
      lockFileName: process.env.LOCK_FILE_NAME || '.license_destroyed',
      torroLockFileName: process.env.TORRO_LOCK_FILE_NAME || '.torro_license_destroyed'
    };

    // Critical Files Configuration
    this.config.criticalFiles = {
      files: process.env.CRITICAL_FILES ? process.env.CRITICAL_FILES.split(',') : ['config.json', 'database.json', 'license.json', '.env'],
      torroFiles: process.env.TORRO_CRITICAL_FILES ? process.env.TORRO_CRITICAL_FILES.split(',') : ['config.json', 'database.json', 'license.json', '.env', 'package.json', 'node_modules']
    };

    // Cron Schedules Configuration
    this.config.cron = {
      licenseCheck: process.env.LICENSE_CHECK_CRON || '* * * * *',
      licenseCleanup: process.env.LICENSE_CLEANUP_CRON || '0 2 * * *'
    };

    // Logging Configuration
    this.config.logging = {
      logDir: process.env.SECURITY_LOG_DIR || './logs',
      logFile: process.env.SECURITY_LOG_FILE || 'security.log',
      violationsFile: process.env.VIOLATIONS_LOG_FILE || 'violations.log',
      metricsFile: process.env.METRICS_FILE || 'metrics.json',
      cleanupInterval: parseInt(process.env.LOG_CLEANUP_INTERVAL) || 3600000,
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 7,
      daemonLogFile: process.env.KEY_DAEMON_LOG_FILE || './logs/key-daemon.log',
      daemonLogLevel: process.env.KEY_DAEMON_LOG_LEVEL || 'info'
    };

    // Client Configuration
    this.config.client = {
      apiUrl: process.env.TORRO_API_URL || 'http://localhost:3001/api',
      gracePeriod: parseInt(process.env.TORRO_GRACE_PERIOD) || 300000,
      validationInterval: parseInt(process.env.TORRO_VALIDATION_INTERVAL) || 60000,
      maxRetries: parseInt(process.env.TORRO_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.TORRO_RETRY_DELAY) || 5000,
      militarySalt: process.env.TORRO_MILITARY_SALT || 'torro-military-salt'
    };

    // Admin Configuration
    this.config.admin = {
      email: process.env.ADMIN_EMAIL || 'admin@torro.com',
      password: process.env.ADMIN_PASSWORD || 'secure-admin-password'
    };

    // Storage Paths Configuration
    this.config.storage = {
      keyStoragePath: process.env.KEY_STORAGE_PATH || './keys',
      keyHistoryPath: process.env.KEY_HISTORY_PATH || './keys/history',
      hashStoragePath: process.env.HASH_STORAGE_PATH || './keys/hashes',
      passwordStoragePath: process.env.PASSWORD_STORAGE_PATH || './keys/passwords'
    };
  }

  get(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  getAll() {
    return this.config;
  }

  // Helper methods for common configurations
  getServerConfig() {
    return this.config.server;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getJWTConfig() {
    return this.config.jwt;
  }

  getEncryptionConfig() {
    return this.config.encryption;
  }

  getMilitarySecurityConfig() {
    return this.config.militarySecurity;
  }

  getKeyRotationConfig() {
    return this.config.keyRotation;
  }

  getHashValidationConfig() {
    return this.config.hashValidation;
  }

  getLicenseConfig() {
    return this.config.license;
  }

  getNetworkSecurityConfig() {
    return this.config.networkSecurity;
  }

  getRiskScoringConfig() {
    return this.config.riskScoring;
  }

  getLoggingConfig() {
    return this.config.logging;
  }

  getAdminConfig() {
    return this.config.admin;
  }

  getDebuggingConfig() {
    return this.config.debugging;
  }

  getIntegrityConfig() {
    return this.config.integrity;
  }

  getSecureDeletionConfig() {
    return this.config.secureDeletion;
  }

  getLockFilesConfig() {
    return this.config.lockFiles;
  }

  getCriticalFilesConfig() {
    return this.config.criticalFiles;
  }

  getCronConfig() {
    return this.config.cron;
  }

  getStorageConfig() {
    return this.config.storage;
  }

  // Validation methods
  validateConfig() {
    const errors = [];

    // Validate required configurations
    if (!this.config.encryption.key || this.config.encryption.key === 'your-32-character-encryption-key-change-this') {
      errors.push('LICENSE_ENCRYPTION_KEY must be set to a secure value');
    }

    if (!this.config.jwt.secret || this.config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
      errors.push('JWT_SECRET must be set to a secure value');
    }

    if (this.config.server.nodeEnv === 'production') {
      if (this.config.database.uri.includes('localhost')) {
        errors.push('MONGODB_URI should not use localhost in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Save configuration to file
  saveConfig(filePath = '.env') {
    const envLines = [];
    
    // Add header
    envLines.push('# ==================== TORRO LICENSE MANAGEMENT SYSTEM ====================');
    envLines.push('# Dynamic Configuration File');
    envLines.push('# Generated on: ' + new Date().toISOString());
    envLines.push('');

    // Server Configuration
    envLines.push('# ==================== SERVER CONFIGURATION ====================');
    envLines.push(`NODE_ENV=${this.config.server.nodeEnv}`);
    envLines.push(`PORT=${this.config.server.port}`);
    envLines.push(`HOST=${this.config.server.host}`);
    envLines.push('');

    // Database Configuration
    envLines.push('# ==================== DATABASE CONFIGURATION ====================');
    envLines.push(`MONGODB_URI=${this.config.database.uri}`);
    envLines.push(`DB_NAME=${this.config.database.name}`);
    envLines.push('');

    // JWT Configuration
    envLines.push('# ==================== JWT CONFIGURATION ====================');
    envLines.push(`JWT_SECRET=${this.config.jwt.secret}`);
    envLines.push(`JWT_EXPIRES_IN=${this.config.jwt.expiresIn}`);
    envLines.push(`JWT_REFRESH_EXPIRES_IN=${this.config.jwt.refreshExpiresIn}`);
    envLines.push('');

    // Encryption Configuration
    envLines.push('# ==================== ENCRYPTION CONFIGURATION ====================');
    envLines.push(`LICENSE_ENCRYPTION_KEY=${this.config.encryption.key}`);
    envLines.push(`LICENSE_SALT=${this.config.encryption.salt}`);
    if (this.config.encryption.rsaPrivateKey) {
      envLines.push(`RSA_PRIVATE_KEY=${this.config.encryption.rsaPrivateKey}`);
    }
    if (this.config.encryption.rsaPublicKey) {
      envLines.push(`RSA_PUBLIC_KEY=${this.config.encryption.rsaPublicKey}`);
    }
    envLines.push('');

    // Military Security Configuration
    envLines.push('# ==================== MILITARY-GRADE SECURITY ====================');
    envLines.push(`MILITARY_SECURITY_ENABLED=${this.config.militarySecurity.enabled}`);
    envLines.push(`HARDWARE_BINDING_REQUIRED=${this.config.militarySecurity.hardwareBindingRequired}`);
    envLines.push(`ANTI_TAMPERING_ENABLED=${this.config.militarySecurity.antiTamperingEnabled}`);
    envLines.push(`SELF_DESTRUCTION_ENABLED=${this.config.militarySecurity.selfDestructionEnabled}`);
    envLines.push(`SECURITY_LEVEL=${this.config.militarySecurity.securityLevel}`);
    envLines.push('');

    // Add all other configurations...
    // (This would continue for all configuration sections)

    const envContent = envLines.join('\n');
    fs.writeFileSync(filePath, envContent);
    
    return filePath;
  }
}

module.exports = DynamicConfig;
