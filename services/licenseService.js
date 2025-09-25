const crypto = require('crypto');
const DynamicConfig = require('../utils/dynamicConfig');
const MilitarySecurity = require('./militarySecurity');

// Load dynamic configuration
const config = new DynamicConfig();

// Get configurations
const encryptionConfig = config.getEncryptionConfig();
const licenseConfig = config.getLicenseConfig();

// Generate a unique license key
const generateLicenseKey = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(licenseConfig.randomLength).toString('hex').toUpperCase();
  const checksum = crypto.createHash('md5').update(timestamp + randomPart).digest('hex').substring(0, licenseConfig.checksumLength).toUpperCase();
  
  return `${licenseConfig.keyPrefix}-${timestamp}-${randomPart}-${checksum}`;
};

// Encrypt license data (for client-side files)
const encryptLicenseData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionConfig.key, 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from('torro-license', 'utf8')); // Additional Authenticated Data
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Encrypt license key for database storage
const encryptLicenseKey = (licenseKey) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionConfig.key, 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from('torro-license-key', 'utf8')); // Different AAD for license key
  let encrypted = cipher.update(licenseKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Decrypt license data (for client-side files)
const decryptLicenseData = (encryptedData, iv, authTag) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionConfig.key, 'utf8');
  
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from('torro-license', 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

// Decrypt license key from database storage
const decryptLicenseKey = (encryptedData, iv, authTag) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(encryptionConfig.key, 'utf8');
  
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from('torro-license-key', 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Validate license format
const validateLicenseFormat = (licenseKey) => {
  const pattern = new RegExp(`^${licenseConfig.keyPrefix}-[a-z0-9]+-[A-F0-9]{${licenseConfig.randomLength * 2}}-[A-F0-9]{${licenseConfig.checksumLength}}$`);
  return pattern.test(licenseKey);
};

// Generate client-side license file content
const generateLicenseFile = (licenseData) => {
  const encrypted = encryptLicenseData(licenseData);
  return {
    license: encrypted.encrypted,
    iv: encrypted.iv,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    authTag: encrypted.authTag
  };
};

// Parse license file
const parseLicenseFile = (licenseFile) => {
  try {
    const { license, iv, authTag } = licenseFile;
    return decryptLicenseData(license, iv, authTag);
  } catch (error) {
    throw new Error('Invalid license file format');
  }
};

// Create license hash for integrity check
const createLicenseHash = (licenseData) => {
  const dataString = JSON.stringify(licenseData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

// Verify license integrity
const verifyLicenseIntegrity = (licenseData, expectedHash) => {
  const actualHash = createLicenseHash(licenseData);
  return actualHash === expectedHash;
};

// Military-grade license creation
const createMilitaryGradeLicense = (licenseData) => {
  const militarySecurity = new MilitarySecurity();
  return militarySecurity.createMilitaryGradeLicense(licenseData);
};

// Military-grade license validation
const validateMilitaryGradeLicense = (licenseData, validationAttempt) => {
  const militarySecurity = new MilitarySecurity();
  return militarySecurity.validateMilitaryLicense(licenseData, validationAttempt);
};

// Hardware fingerprinting
const getHardwareFingerprint = () => {
  const militarySecurity = new MilitarySecurity();
  return militarySecurity.getHardwareFingerprint();
};

// Risk scoring
const calculateRiskScore = (licenseData, validationAttempt) => {
  const militarySecurity = new MilitarySecurity();
  return militarySecurity.calculateRiskScore(licenseData, validationAttempt);
};

module.exports = {
  generateLicenseKey,
  encryptLicenseData,
  decryptLicenseData,
  encryptLicenseKey,
  decryptLicenseKey,
  validateLicenseFormat,
  generateLicenseFile,
  parseLicenseFile,
  createLicenseHash,
  verifyLicenseIntegrity,
  createMilitaryGradeLicense,
  validateMilitaryGradeLicense,
  getHardwareFingerprint,
  calculateRiskScore
};
