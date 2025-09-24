const express = require('express');
const License = require('../models/License');
const { auth, adminOnly } = require('../middleware/auth');
const { generateLicenseKey, encryptLicenseData } = require('../services/licenseService');

const router = express.Router();

// Get all licenses (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, licenseType } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (licenseType) query.licenseType = licenseType;

    const licenses = await License.find(query)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await License.countDocuments(query);

    res.json({
      licenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Get license by ID
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const license = await License.findById(req.params.id).populate('createdBy', 'email');
    
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json(license);
  } catch (error) {
    console.error('Get license error:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

// Create new license (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      productName = 'Torro Platform',
      version = '1.0.0',
      licenseType = 'trial',
      expiryDays = 30,
      maxUsers = 1,
      maxConnections = 10,
      features = {},
      notes
    } = req.body;

    // Generate unique license key and client ID
    const licenseKey = generateLicenseKey();
    const clientId = `TORRO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Create license
    const license = new License({
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
      features: new Map(Object.entries(features)),
      notes,
      createdBy: req.user.userId
    });

    await license.save();

    // Return license info for client
    res.status(201).json({
      message: 'License created successfully',
      license: license.getClientInfo()
    });
  } catch (error) {
    console.error('Create license error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'License key or client ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create license' });
    }
  }
});

// Update license (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.licenseKey; // Prevent changing license key
    delete updates.clientId; // Prevent changing client ID

    const license = await License.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({
      message: 'License updated successfully',
      license: license.getClientInfo()
    });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

// Delete license (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const license = await License.findByIdAndDelete(req.params.id);
    
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ message: 'License deleted successfully' });
  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

// Validate license (public endpoint for client applications)
router.post('/validate', async (req, res) => {
  try {
    const { licenseKey, clientId } = req.body;

    if (!licenseKey || !clientId) {
      return res.status(400).json({ error: 'License key and client ID are required' });
    }

    const license = await License.findOne({ licenseKey, clientId });
    
    if (!license) {
      return res.status(404).json({ 
        error: 'Invalid license',
        valid: false
      });
    }

    // Update last checked time and increment check count
    license.lastChecked = new Date();
    license.checkCount += 1;
    license.lastAccessIP = req.ip;
    license.lastAccessUserAgent = req.get('User-Agent');
    await license.save();

    // Check if license is valid
    const isValid = license.isValid();

    if (!isValid) {
      return res.status(403).json({
        error: 'License has expired or is inactive',
        valid: false,
        expiryDate: license.expiryDate,
        status: license.status
      });
    }

    res.json({
      valid: true,
      license: license.getClientInfo()
    });
  } catch (error) {
    console.error('Validate license error:', error);
    res.status(500).json({ error: 'License validation failed' });
  }
});

// Get license statistics (admin only)
router.get('/stats/overview', auth, adminOnly, async (req, res) => {
  try {
    const total = await License.countDocuments();
    const active = await License.countDocuments({ status: 'active' });
    const expired = await License.countDocuments({ status: 'expired' });
    const suspended = await License.countDocuments({ status: 'suspended' });
    const revoked = await License.countDocuments({ status: 'revoked' });

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = await License.countDocuments({
      status: 'active',
      expiryDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    });

    res.json({
      total,
      active,
      expired,
      suspended,
      revoked,
      expiringSoon
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;


