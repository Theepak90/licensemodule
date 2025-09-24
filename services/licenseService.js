const crypto = require('crypto');

// Generate a unique license key
const generateLicenseKey = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
  const checksum = crypto.createHash('md5').update(timestamp + randomPart).digest('hex').substring(0, 8).toUpperCase();
  
  return `TORRO-${timestamp}-${randomPart}-${checksum}`;
};

// Encrypt license data
const encryptLicenseData = (data) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.LICENSE_ENCRYPTION_KEY || 'your-32-character-encryption-key', 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
};

// Decrypt license data
const decryptLicenseData = (encryptedData, iv) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.LICENSE_ENCRYPTION_KEY || 'your-32-character-encryption-key', 'utf8');
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

// Validate license format
const validateLicenseFormat = (licenseKey) => {
  const pattern = /^TORRO-[a-z0-9]+-[A-F0-9]{32}-[A-F0-9]{8}$/;
  return pattern.test(licenseKey);
};

// Generate client-side license file content
const generateLicenseFile = (licenseData) => {
  const encrypted = encryptLicenseData(licenseData);
  return {
    license: encrypted.encrypted,
    iv: encrypted.iv,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
};

// Parse license file
const parseLicenseFile = (licenseFile) => {
  try {
    const { license, iv } = licenseFile;
    return decryptLicenseData(license, iv);
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

module.exports = {
  generateLicenseKey,
  encryptLicenseData,
  decryptLicenseData,
  validateLicenseFormat,
  generateLicenseFile,
  parseLicenseFile,
  createLicenseHash,
  verifyLicenseIntegrity
};


