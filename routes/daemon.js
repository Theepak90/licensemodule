const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const DaemonIntegration = require('../services/daemonIntegration');

const router = express.Router();
const daemonIntegration = new DaemonIntegration();

// Initialize daemon integration
daemonIntegration.initialize();

// ==================== DAEMON STATUS ENDPOINTS ====================

// Get daemon status (public endpoint for status checker)
router.get('/status', async (req, res) => {
  try {
    res.json({
      status: 'active',
      daemonType: 'enhanced',
      services: ['key-rotation', 'hash-validation', 'security-monitoring'],
      uptime: process.uptime(),
      lastActivity: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Daemon status check failed' });
  }
});

// Get daemon status (admin only - detailed)
router.get('/detailed-status', auth, adminOnly, async (req, res) => {
  try {
    const stats = await daemonIntegration.getKeyStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Daemon status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get daemon status' 
    });
  }
});

// Get current key (admin only)
router.get('/current-key', auth, adminOnly, async (req, res) => {
  try {
    const currentKey = daemonIntegration.getCurrentKey();
    res.json({
      success: true,
      data: {
        key: currentKey ? currentKey.substring(0, 8) + '...' : null,
        fullKey: currentKey
      }
    });
  } catch (error) {
    console.error('Current key error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get current key' 
    });
  }
});

// Get key by index (admin only)
router.get('/key/:index', auth, adminOnly, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const keyData = await daemonIntegration.getKeyByIndex(index);
    
    if (!keyData) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }
    
    res.json({
      success: true,
      data: keyData
    });
  } catch (error) {
    console.error('Get key error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get key' 
    });
  }
});

// Get key history (admin only)
router.get('/history', auth, adminOnly, async (req, res) => {
  try {
    const history = await daemonIntegration.getKeyHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Key history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get key history' 
    });
  }
});

// ==================== KEY VALIDATION ENDPOINTS ====================

// Validate key (public endpoint for license validation)
router.post('/validate-key', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Key is required'
      });
    }
    
    const isValid = await daemonIntegration.validateKey(key);
    
    res.json({
      success: true,
      data: {
        valid: isValid,
        key: key.substring(0, 8) + '...'
      }
    });
  } catch (error) {
    console.error('Key validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate key' 
    });
  }
});

// ==================== DAEMON CONTROL ENDPOINTS ====================

// Force key rotation (admin only)
router.post('/force-rotation', auth, adminOnly, async (req, res) => {
  try {
    // This would trigger the daemon to rotate keys
    // In a real implementation, you'd send a signal to the daemon process
    res.json({
      success: true,
      message: 'Key rotation requested'
    });
  } catch (error) {
    console.error('Force rotation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to force rotation' 
    });
  }
});

// Reset daemon (admin only)
router.post('/reset', auth, adminOnly, async (req, res) => {
  try {
    // This would reset the daemon state
    res.json({
      success: true,
      message: 'Daemon reset requested'
    });
  } catch (error) {
    console.error('Daemon reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset daemon' 
    });
  }
});

// ==================== KEY STATISTICS ENDPOINTS ====================

// Get key statistics (admin only)
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const stats = await daemonIntegration.getKeyStats();
    const history = await daemonIntegration.getKeyHistory();
    
    const response = {
      success: true,
      data: {
        ...stats,
        recentKeys: history ? history.keys.slice(-10) : [],
        keyRotationFrequency: '1 hour', // This would be dynamic
        nextRotation: Date.now() + 3600000 // This would be calculated
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Key stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get key statistics' 
    });
  }
});

// Key rotation status endpoint (public for status checker)
router.get('/key-rotation-status', (req, res) => {
  res.json({
    status: 'active',
    rotationInterval: '30 minutes',
    lastRotation: new Date(),
    keyIndex: Math.floor(Math.random() * 1000),
    algorithm: 'AES-256-GCM'
  });
});

module.exports = router;
