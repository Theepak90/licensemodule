const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  licenseKey: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  }
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

// Method to get license info for client
licenseSchema.methods.getClientInfo = function() {
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


