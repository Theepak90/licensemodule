const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Military-Grade Secure License Model
 * 
 * This model includes advanced security features:
 * - Multi-layer encryption
 * - Hardware fingerprinting
 * - Tamper detection
 * - Time-based validation
 * - Integrity monitoring
 */

const secureLicenseSchema = new mongoose.Schema({
  // Basic License Information
  licenseKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        // Validate military-grade license key format
        return /^TORRO-MIL-[a-z0-9]+-[A-F0-9]{64}-[A-F0-9]{8}$/.test(v);
      },
      message: 'Invalid military-grade license key format'
    }
  },
  
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^TORRO-[0-9]+-[A-Z0-9]{9}$/.test(v);
      },
      message: 'Invalid client ID format'
    }
  },

  // Client Information
  clientName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },

  // Product Information
  productName: {
    type: String,
    default: 'Torro Platform',
    trim: true
  },
  
  version: {
    type: String,
    default: '1.0.0',
    trim: true
  },

  // License Configuration
  licenseType: {
    type: String,
    enum: ['trial', 'standard', 'premium', 'enterprise', 'military'],
    default: 'trial',
    index: true
  },

  // Security Status
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'revoked', 'compromised'],
    default: 'active',
    index: true
  },

  // Dates
  issuedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiryDate: {
    type: Date,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },

  // License Limits
  maxUsers: {
    type: Number,
    default: 1,
    min: 1,
    max: 10000
  },
  
  maxConnections: {
    type: Number,
    default: 10,
    min: 1,
    max: 100000
  },

  // Features (encrypted)
  features: {
    type: Map,
    of: Boolean,
    default: new Map([
      ['database_access', true],
      ['api_access', true],
      ['analytics', false],
      ['support', false],
      ['military_grade_security', false],
      ['hardware_binding', false],
      ['anti_tampering', false],
      ['self_destruction', false]
    ])
  },

  // Military-Grade Security Fields
  securityLevel: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'military'],
    default: 'basic'
  },

  // Hardware Fingerprinting
  hardwareFingerprint: {
    primary: {
      type: String,
      required: function() {
        return this.securityLevel === 'military';
      },
      validate: {
        validator: function(v) {
          return v && v.length === 128; // SHA-512 length
        },
        message: 'Invalid hardware fingerprint'
      }
    },
    
    components: [{
      type: String,
      validate: {
        validator: function(v) {
          return v && v.length === 64; // SHA-256 length
        },
        message: 'Invalid hardware component fingerprint'
      }
    }],
    
    bindingTimestamp: {
      type: Date,
      default: Date.now
    }
  },

  // Encryption Keys (server-side only)
  encryptionKeys: {
    layer1Key: {
      type: String,
      select: false // Never include in JSON output
    },
    
    layer2Key: {
      type: String,
      select: false
    },
    
    layer3PrivateKey: {
      type: String,
      select: false
    },
    
    keyRotationTimestamp: {
      type: Date,
      default: Date.now
    }
  },

  // Integrity Checksums
  integrityChecksums: {
    sha256: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length === 64;
        },
        message: 'Invalid SHA-256 checksum'
      }
    },
    
    sha512: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length === 128;
        },
        message: 'Invalid SHA-512 checksum'
      }
    },
    
    custom: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length === 128;
        },
        message: 'Invalid custom checksum'
      }
    },
    
    lastVerified: {
      type: Date,
      default: Date.now
    }
  },

  // Validation Tracking
  validationHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    success: {
      type: Boolean,
      required: true
    },
    
    ipAddress: String,
    
    userAgent: String,
    
    hardwareMatch: {
      type: Boolean,
      default: true
    },
    
    securityViolations: [{
      type: String,
      enum: ['tampering_detected', 'debugger_detected', 'checksum_mismatch', 'hardware_mismatch', 'time_manipulation']
    }],
    
    responseTime: Number,
    
    location: {
      country: String,
      region: String,
      city: String
    }
  }],

  // Security Monitoring
  securityMetrics: {
    totalValidations: {
      type: Number,
      default: 0
    },
    
    failedValidations: {
      type: Number,
      default: 0
    },
    
    securityViolations: {
      type: Number,
      default: 0
    },
    
    lastSecurityCheck: {
      type: Date,
      default: Date.now
    },
    
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Network Validation
  networkValidation: {
    enabled: {
      type: Boolean,
      default: false
    },
    
    allowedIPs: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
        },
        message: 'Invalid IP address format'
      }
    }],
    
    allowedCountries: [String],
    
    maxRequestsPerHour: {
      type: Number,
      default: 1000
    },
    
    currentRequests: {
      type: Number,
      default: 0
    },
    
    lastRequestReset: {
      type: Date,
      default: Date.now
    }
  },

  // Self-Destruction Configuration
  selfDestruction: {
    enabled: {
      type: Boolean,
      default: false
    },
    
    gracePeriod: {
      type: Number,
      default: 300000, // 5 minutes
      min: 60000, // Minimum 1 minute
      max: 3600000 // Maximum 1 hour
    },
    
    destructionTriggers: [{
      type: String,
      enum: ['expiry', 'tampering', 'security_violation', 'manual']
    }],
    
    lastDestructionAttempt: Date,
    
    destructionCount: {
      type: Number,
      default: 0
    }
  },

  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'validated', 'suspended', 'revoked', 'expired', 'security_violation']
    },
    
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    details: {
      type: Map,
      of: String
    },
    
    ipAddress: String,
    
    userAgent: String
  }],

  // Additional Metadata
  notes: {
    type: String,
    maxlength: 1000
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance and security
secureLicenseSchema.index({ expiryDate: 1, status: 1 });
secureLicenseSchema.index({ clientId: 1, status: 1 });
secureLicenseSchema.index({ licenseKey: 1, status: 1 });
secureLicenseSchema.index({ 'hardwareFingerprint.primary': 1 });
secureLicenseSchema.index({ 'securityMetrics.riskScore': -1 });
secureLicenseSchema.index({ createdAt: -1 });

// Virtual fields
secureLicenseSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

secureLicenseSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

secureLicenseSchema.virtual('isCompromised').get(function() {
  return this.status === 'compromised' || this.securityMetrics.riskScore > 80;
});

// Instance methods
secureLicenseSchema.methods.isValid = function() {
  return this.status === 'active' && !this.isExpired && !this.isCompromised;
};

secureLicenseSchema.methods.validateHardwareFingerprint = function(fingerprint) {
  if (this.securityLevel !== 'military') return true;
  
  return this.hardwareFingerprint.primary === fingerprint.primary;
};

secureLicenseSchema.methods.updateIntegrityChecksums = function(licenseData) {
  const dataString = JSON.stringify(licenseData);
  
  this.integrityChecksums.sha256 = crypto.createHash('sha256').update(dataString).digest('hex');
  this.integrityChecksums.sha512 = crypto.createHash('sha512').update(dataString).digest('hex');
  this.integrityChecksums.custom = crypto.pbkdf2Sync(dataString, process.env.LICENSE_SALT || 'military-salt', 10000, 64, 'sha512').toString('hex');
  this.integrityChecksums.lastVerified = new Date();
};

secureLicenseSchema.methods.addValidationRecord = function(validationData) {
  this.validationHistory.push({
    ...validationData,
    timestamp: new Date()
  });
  
  // Keep only last 1000 validation records
  if (this.validationHistory.length > 1000) {
    this.validationHistory = this.validationHistory.slice(-1000);
  }
  
  // Update metrics
  this.securityMetrics.totalValidations++;
  if (!validationData.success) {
    this.securityMetrics.failedValidations++;
  }
  
  if (validationData.securityViolations && validationData.securityViolations.length > 0) {
    this.securityMetrics.securityViolations += validationData.securityViolations.length;
    this.securityMetrics.riskScore = Math.min(100, this.securityMetrics.riskScore + validationData.securityViolations.length * 10);
  }
  
  this.securityMetrics.lastSecurityCheck = new Date();
};

secureLicenseSchema.methods.getClientInfo = function() {
  // Only return safe, non-sensitive information
  return {
    licenseKey: this.licenseKey,
    clientId: this.clientId,
    productName: this.productName,
    version: this.version,
    licenseType: this.licenseType,
    expiryDate: this.expiryDate,
    maxUsers: this.maxUsers,
    maxConnections: this.maxConnections,
    features: Object.fromEntries(this.features),
    securityLevel: this.securityLevel,
    daysUntilExpiry: this.daysUntilExpiry,
    isValid: this.isValid(),
    selfDestruction: {
      enabled: this.selfDestruction.enabled,
      gracePeriod: this.selfDestruction.gracePeriod
    }
  };
};

// Static methods
secureLicenseSchema.statics.findByLicenseKey = function(licenseKey) {
  return this.findOne({ licenseKey, status: { $ne: 'revoked' } });
};

secureLicenseSchema.statics.findExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    expiryDate: { $lte: futureDate, $gte: new Date() }
  });
};

secureLicenseSchema.statics.findHighRisk = function() {
  return this.find({
    'securityMetrics.riskScore': { $gte: 70 },
    status: 'active'
  });
};

// Pre-save middleware
secureLicenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update integrity checksums if license data has changed
  if (this.isModified()) {
    this.updateIntegrityChecksums(this.toObject());
  }
  
  next();
});

// Pre-validate middleware
secureLicenseSchema.pre('validate', function(next) {
  // Ensure military-grade licenses have hardware fingerprinting
  if (this.securityLevel === 'military' && !this.hardwareFingerprint.primary) {
    return next(new Error('Military-grade licenses require hardware fingerprinting'));
  }
  
  next();
});

module.exports = mongoose.model('SecureLicense', secureLicenseSchema);
