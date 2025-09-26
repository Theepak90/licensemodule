const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  // licenseKey field removed - now using only encrypted storage
  // Encrypted license key storage
  encryptedLicenseKey: {
    encrypted: String,
    iv: String,
    authTag: String
  },
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    default: 'Torro Platform'
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  licenseType: {
    type: String,
    enum: ['trial', 'standard', 'premium', 'enterprise'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'revoked'],
    default: 'active'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  maxUsers: {
    type: Number,
    default: 1
  },
  maxConnections: {
    type: Number,
    default: 10
  },
  features: {
    type: Map,
    of: Boolean,
    default: new Map([
      ['database_access', true],
      ['api_access', true],
      ['analytics', false],
      ['support', false]
    ])
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  checkCount: {
    type: Number,
    default: 0
  },
  lastAccessIP: {
    type: String
  },
  lastAccessUserAgent: {
    type: String
  },
  notes: {
    type: String
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
  },
  // Military-grade security fields - FORCE ALL LICENSES TO USE MILITARY SECURITY
  militaryGrade: {
    type: Boolean,
    default: true
  },
  hardwareBinding: {
    type: Boolean,
    default: true
  },
  hardwareFingerprint: {
    type: String
  },
  hardwareComponents: {
    type: Object
  },
  integrityChecksums: {
    type: Object
  },
  encryptedData: {
    type: Object
  },
  securityLevel: {
    type: String,
    enum: ['basic', 'military'],
    default: 'military'
  },
  allowedIPs: [{
    type: String
  }],
  allowedCountries: [{
    type: String
  }],
  riskScore: {
    type: Number,
    default: 0
  },
  securityViolations: [{
    type: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: Object
    }
  }]
});

// Index for efficient queries
licenseSchema.index({ expiryDate: 1, status: 1 });
licenseSchema.index({ clientId: 1, status: 1 });

// Virtual for days until expiry
licenseSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
licenseSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

// Method to check if license is valid
licenseSchema.methods.isValid = function() {
  return this.status === 'active' && !this.isExpired;
};

// Method to get decrypted license key
licenseSchema.methods.getDecryptedLicenseKey = function() {
  if (this.encryptedLicenseKey && 
      this.encryptedLicenseKey.encrypted && 
      this.encryptedLicenseKey.iv && 
      this.encryptedLicenseKey.authTag) {
    const { decryptLicenseKey } = require('../services/licenseService');
    try {
      return decryptLicenseKey(
        this.encryptedLicenseKey.encrypted,
        this.encryptedLicenseKey.iv,
        this.encryptedLicenseKey.authTag
      );
    } catch (error) {
      console.error('Error decrypting license key:', error);
      return 'LICENSE_KEY_DECRYPTION_ERROR';
    }
  }
  return 'LICENSE_KEY_NOT_AVAILABLE';
};

// Method to get encrypted license key (3-level encrypted)
licenseSchema.methods.getEncryptedLicenseKey = function() {
  if (this.encryptedLicenseKey && 
      this.encryptedLicenseKey.encrypted && 
      this.encryptedLicenseKey.iv && 
      this.encryptedLicenseKey.authTag) {
    // Return the encrypted string (this is the 3-level encrypted key)
    return this.encryptedLicenseKey.encrypted;
  }
  return 'ENCRYPTED_KEY_NOT_AVAILABLE';
};

// Method to get license info for client
licenseSchema.methods.getClientInfo = function(options = {}) {
  const { showEncryptedKey = false } = options;
  
  return {
    licenseKey: showEncryptedKey ? this.getEncryptedLicenseKey() : this.getDecryptedLicenseKey(),
    clientId: this.clientId,
    clientName: this.clientName,
    clientEmail: this.clientEmail,
    productName: this.productName,
    version: this.version,
    licenseType: this.licenseType,
    status: this.status,
    issuedDate: this.issuedDate,
    expiryDate: this.expiryDate,
    maxUsers: this.maxUsers,
    maxConnections: this.maxConnections,
    features: Object.fromEntries(this.features),
    daysUntilExpiry: this.daysUntilExpiry,
    isValid: this.isValid()
  };
};

// Update timestamp on save
licenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('License', licenseSchema);



