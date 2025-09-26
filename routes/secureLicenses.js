const express = require('express');
const crypto = require('crypto');
const SecureLicense = require('../models/SecureLicense');
const MilitaryGradeSecurity = require('../services/militaryGradeSecurity');
const { auth, adminOnly } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const security = new MilitaryGradeSecurity();

// Rate limiting for license validation
const validationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many validation requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Get all secure licenses (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      licenseType, 
      securityLevel,
      riskScore 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (licenseType) query.licenseType = licenseType;
    if (securityLevel) query.securityLevel = securityLevel;
    if (riskScore) query['securityMetrics.riskScore'] = { $gte: parseInt(riskScore) };

    const licenses = await SecureLicense.find(query)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-encryptionKeys -integrityChecksums'); // Exclude sensitive data

    const total = await SecureLicense.countDocuments(query);

    res.json({
      licenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get secure licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Get secure license by ID (admin only)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const license = await SecureLicense.findById(req.params.id)
      .populate('createdBy', 'email')
      .select('-encryptionKeys'); // Exclude encryption keys

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json(license);
  } catch (error) {
    console.error('Get secure license error:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

// Create new secure license (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      productName = 'Torro Platform',
      version = '1.0.0',
      licenseType = 'trial',
      securityLevel = 'basic',
      expiryDays = 30,
      maxUsers = 1,
      maxConnections = 10,
      features = {},
      hardwareBinding = false,
      selfDestruction = false,
      networkValidation = false,
      allowedIPs = [],
      allowedCountries = [],
      notes
    } = req.body;

    // Generate military-grade license key
    const licenseKey = security.generateSecureLicenseKey();
    
    // Generate truly unique client ID with multiple entropy sources
    const timestamp = Date.now();
    const randomPart1 = crypto.randomBytes(4).toString('hex').toUpperCase();
    const randomPart2 = Math.random().toString(36).substr(2, 9).toUpperCase();
    const processId = process.pid.toString(36).toUpperCase();
    const clientId = `TORRO-${timestamp}-${randomPart1}-${randomPart2}-${processId}`;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Generate hardware fingerprint if required
    let hardwareFingerprint = null;
    if (securityLevel === 'military' || hardwareBinding) {
      hardwareFingerprint = security.generateHardwareFingerprint();
    }

    // Create license data for encryption
    const licenseData = {
      licenseKey,
      clientId,
      clientName,
      clientEmail,
      productName,
      version,
      licenseType,
      expiryDate,
      maxUsers,
      maxConnections,
      features,
      securityLevel
    };

    // Encrypt license data if military-grade
    let encryptedData = null;
    if (securityLevel === 'military') {
      encryptedData = security.encryptLicenseData(licenseData, hardwareFingerprint);
    }

    // Check for existing license with same client ID (extra safety)
    const existingLicense = await SecureLicense.findOne({ clientId });
    if (existingLicense) {
      // Regenerate client ID if collision detected
      const newTimestamp = Date.now() + Math.floor(Math.random() * 1000);
      const newRandomPart1 = crypto.randomBytes(4).toString('hex').toUpperCase();
      const newRandomPart2 = Math.random().toString(36).substr(2, 9).toUpperCase();
      const newProcessId = process.pid.toString(36).toUpperCase();
      clientId = `TORRO-${newTimestamp}-${newRandomPart1}-${newRandomPart2}-${newProcessId}`;
    }

    // Create secure license
    const secureLicense = new SecureLicense({
      licenseKey,
      clientId,
      clientName,
      clientEmail,
      productName,
      version,
      licenseType,
      securityLevel,
      expiryDate,
      maxUsers,
      maxConnections,
      features: new Map(Object.entries(features)),
      hardwareFingerprint,
      encryptionKeys: encryptedData ? {
        layer1Key: encryptedData.encrypted,
        layer2Key: encryptedData.checksums.sha256,
        layer3PrivateKey: encryptedData.privateKey,
        keyRotationTimestamp: new Date()
      } : undefined,
      integrityChecksums: {
        sha256: security.generateChecksums(JSON.stringify(licenseData)).sha256,
        sha512: security.generateChecksums(JSON.stringify(licenseData)).sha512,
        custom: security.generateCustomChecksum(JSON.stringify(licenseData))
      },
      networkValidation: {
        enabled: networkValidation,
        allowedIPs,
        allowedCountries,
        maxRequestsPerHour: 1000
      },
      selfDestruction: {
        enabled: selfDestruction,
        gracePeriod: 300000, // 5 minutes
        destructionTriggers: ['expiry', 'tampering']
      },
      notes,
      createdBy: req.user.userId
    });

    await secureLicense.save();

    // Add audit trail
    secureLicense.auditTrail.push({
      action: 'created',
      performedBy: req.user.userId,
      details: new Map([
        ['securityLevel', securityLevel],
        ['hardwareBinding', hardwareBinding.toString()],
        ['selfDestruction', selfDestruction.toString()]
      ])
    });

    await secureLicense.save();

    res.status(201).json({
      message: 'Secure license created successfully',
      license: secureLicense.getClientInfo()
    });
  } catch (error) {
    console.error('Create secure license error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'License key or client ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create secure license' });
    }
  }
});

// Validate secure license (public endpoint with rate limiting)
router.post('/validate', validationLimiter, async (req, res) => {
  try {
    const { licenseKey, clientId, hardwareFingerprint } = req.body;

    if (!licenseKey || !clientId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'License key and client ID are required'
      });
    }

    // Find license
    const license = await SecureLicense.findByLicenseKey(licenseKey);
    
    if (!license) {
      return res.status(404).json({ 
        error: 'Invalid license',
        valid: false,
        code: 'LICENSE_NOT_FOUND'
      });
    }

    // Verify client ID
    if (license.clientId !== clientId) {
      license.addValidationRecord({
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        securityViolations: ['client_id_mismatch']
      });
      await license.save();

      return res.status(403).json({
        error: 'Client ID mismatch',
        valid: false,
        code: 'CLIENT_ID_MISMATCH'
      });
    }

    // Check if license is valid
    if (!license.isValid()) {
      return res.status(403).json({
        error: 'License is not valid',
        valid: false,
        code: license.status === 'expired' ? 'LICENSE_EXPIRED' : 'LICENSE_INVALID',
        expiryDate: license.expiryDate,
        status: license.status
      });
    }

    // Hardware fingerprint validation for military-grade licenses
    if (license.securityLevel === 'military') {
      if (!hardwareFingerprint) {
        return res.status(400).json({
          error: 'Hardware fingerprint required',
          valid: false,
          code: 'HARDWARE_FINGERPRINT_REQUIRED'
        });
      }

      if (!license.validateHardwareFingerprint(hardwareFingerprint)) {
        license.addValidationRecord({
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          securityViolations: ['hardware_mismatch']
        });
        await license.save();

        return res.status(403).json({
          error: 'Hardware fingerprint mismatch',
          valid: false,
          code: 'HARDWARE_MISMATCH'
        });
      }
    }

    // Network validation
    if (license.networkValidation.enabled) {
      const clientIP = req.ip;
      
      // Check IP whitelist
      if (license.networkValidation.allowedIPs.length > 0) {
        if (!license.networkValidation.allowedIPs.includes(clientIP)) {
          license.addValidationRecord({
            success: false,
            ipAddress: clientIP,
            userAgent: req.get('User-Agent'),
            securityViolations: ['ip_not_allowed']
          });
          await license.save();

          return res.status(403).json({
            error: 'IP address not allowed',
            valid: false,
            code: 'IP_NOT_ALLOWED'
          });
        }
      }

      // Check rate limiting
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      if (license.networkValidation.lastRequestReset < oneHourAgo) {
        license.networkValidation.currentRequests = 0;
        license.networkValidation.lastRequestReset = now;
      }

      if (license.networkValidation.currentRequests >= license.networkValidation.maxRequestsPerHour) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          valid: false,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      license.networkValidation.currentRequests++;
    }

    // Record successful validation
    license.addValidationRecord({
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      hardwareMatch: license.securityLevel === 'military' ? true : undefined,
      responseTime: Date.now() - req.startTime
    });

    await license.save();

    // Return license info
    res.json({
      valid: true,
      license: license.getClientInfo(),
      securityLevel: license.securityLevel,
      riskScore: license.securityMetrics.riskScore
    });

  } catch (error) {
    console.error('Validate secure license error:', error);
    res.status(500).json({ 
      error: 'License validation failed',
      message: 'Internal server error'
    });
  }
});

// Update secure license (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.licenseKey;
    delete updates.clientId;
    delete updates.encryptionKeys;
    delete updates.integrityChecksums;
    delete updates.validationHistory;

    const license = await SecureLicense.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Add audit trail
    license.auditTrail.push({
      action: 'updated',
      performedBy: req.user.userId,
      details: new Map(Object.entries(updates))
    });

    await license.save();

    res.json({
      message: 'Secure license updated successfully',
      license: license.getClientInfo()
    });
  } catch (error) {
    console.error('Update secure license error:', error);
    res.status(500).json({ error: 'Failed to update secure license' });
  }
});

// Delete secure license (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const license = await SecureLicense.findByIdAndDelete(req.params.id);
    
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ message: 'Secure license deleted successfully' });
  } catch (error) {
    console.error('Delete secure license error:', error);
    res.status(500).json({ error: 'Failed to delete secure license' });
  }
});

// Get license statistics (admin only)
router.get('/stats/overview', auth, adminOnly, async (req, res) => {
  try {
    const total = await SecureLicense.countDocuments();
    const active = await SecureLicense.countDocuments({ status: 'active' });
    const expired = await SecureLicense.countDocuments({ status: 'expired' });
    const compromised = await SecureLicense.countDocuments({ status: 'compromised' });
    const military = await SecureLicense.countDocuments({ securityLevel: 'military' });
    const highRisk = await SecureLicense.countDocuments({ 'securityMetrics.riskScore': { $gte: 70 } });

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = await SecureLicense.countDocuments({
      status: 'active',
      expiryDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    });

    res.json({
      total,
      active,
      expired,
      compromised,
      military,
      highRisk,
      expiringSoon
    });
  } catch (error) {
    console.error('Get secure license stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get high-risk licenses (admin only)
router.get('/security/high-risk', auth, adminOnly, async (req, res) => {
  try {
    const highRiskLicenses = await SecureLicense.findHighRisk()
      .select('licenseKey clientName clientEmail securityMetrics.riskScore status')
      .sort({ 'securityMetrics.riskScore': -1 })
      .limit(50);

    res.json(highRiskLicenses);
  } catch (error) {
    console.error('Get high-risk licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch high-risk licenses' });
  }
});

// Security violation endpoint (for client reporting)
router.post('/security/violation', validationLimiter, async (req, res) => {
  try {
    const { licenseKey, clientId, violationType, details } = req.body;

    if (!licenseKey || !clientId || !violationType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'License key, client ID, and violation type are required'
      });
    }

    const license = await SecureLicense.findByLicenseKey(licenseKey);
    
    if (!license || license.clientId !== clientId) {
      return res.status(404).json({ error: 'License not found' });
    }

    // Record security violation
    license.addValidationRecord({
      success: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      securityViolations: [violationType]
    });

    // Add audit trail
    license.auditTrail.push({
      action: 'security_violation',
      details: new Map([
        ['violationType', violationType],
        ['details', JSON.stringify(details)]
      ])
    });

    await license.save();

    res.json({ message: 'Security violation recorded' });
  } catch (error) {
    console.error('Record security violation error:', error);
    res.status(500).json({ error: 'Failed to record security violation' });
  }
});

module.exports = router;
