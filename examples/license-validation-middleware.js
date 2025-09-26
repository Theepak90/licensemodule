/**
 * Express Middleware for License Validation
 * 
 * This middleware can be integrated into your Express application
 * to validate licenses on protected routes.
 */

const axios = require('axios');
const DynamicConfig = require('../utils/dynamicConfig');

/**
 * License validation middleware factory
 */
function createLicenseValidationMiddleware(options = {}) {
  // Use dynamic configuration for default API URL
  const config = new DynamicConfig();
  const serverConfig = config.getServerConfig();
  const defaultApiUrl = `http://${serverConfig.host}:${serverConfig.port}/api`;
  
  const {
    apiUrl = defaultApiUrl,
    licenseKeyHeader = 'x-license-key',
    clientIdHeader = 'x-client-id',
    timeout = 10000,
    cacheTime = 300000, // 5 minutes
    skipPaths = ['/health', '/status'],
    onValidationFailure = (req, res, next) => {
      res.status(403).json({
        error: 'License validation failed',
        message: 'Invalid or expired license'
      });
    }
  } = options;

  // Simple in-memory cache
  const cache = new Map();

  return async (req, res, next) => {
    try {
      // Skip validation for certain paths
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Extract license information from headers
      const licenseKey = req.headers[licenseKeyHeader] || req.headers['license-key'];
      const clientId = req.headers[clientIdHeader] || req.headers['client-id'];

      if (!licenseKey || !clientId) {
        return res.status(400).json({
          error: 'Missing license information',
          message: `Required headers: ${licenseKeyHeader}, ${clientIdHeader}`
        });
      }

      // Create cache key
      const cacheKey = `${licenseKey}:${clientId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cacheTime) {
        req.license = cached.data;
        return next();
      }

      // Validate license with server
      const response = await axios.post(`${apiUrl}/licenses/validate`, {
        licenseKey,
        clientId
      }, {
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.valid) {
        return onValidationFailure(req, res, next);
      }

      // Cache the result
      cache.set(cacheKey, {
        data: response.data.license,
        timestamp: Date.now()
      });

      // Add license info to request object
      req.license = response.data.license;

      next();

    } catch (error) {
      console.error('License validation middleware error:', error.message);
      
      if (error.response?.status === 404) {
        return res.status(403).json({
          error: 'License not found',
          message: 'Invalid license key or client ID'
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'License expired',
          message: 'Your license has expired'
        });
      }

      // For other errors, you might want to allow the request through
      // or return an error depending on your security requirements
      return res.status(500).json({
        error: 'License validation service unavailable',
        message: 'Please try again later'
      });
    }
  };
}

/**
 * Middleware to check license features
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    if (!req.license) {
      return res.status(500).json({
        error: 'License not validated',
        message: 'License validation middleware must be used before feature check'
      });
    }

    const hasFeature = req.license.features && req.license.features[featureName];
    
    if (!hasFeature) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `Feature '${featureName}' is not included in your license`
      });
    }

    next();
  };
}

/**
 * Middleware to check license limits
 */
function checkLicenseLimit(limitType) {
  return (req, res, next) => {
    if (!req.license) {
      return res.status(500).json({
        error: 'License not validated',
        message: 'License validation middleware must be used before limit check'
      });
    }

    const limit = req.license[limitType];
    
    if (limit && req.body && req.body.count > limit) {
      return res.status(403).json({
        error: 'License limit exceeded',
        message: `Your license allows maximum ${limit} ${limitType}`
      });
    }

    next();
  };
}

/**
 * Example Express application with license validation
 */
function createExampleApp() {
  const express = require('express');
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // License validation middleware
  const licenseValidation = createLicenseValidationMiddleware({
    // apiUrl will use dynamic configuration if not specified
    onValidationFailure: (req, res, next) => {
      res.status(403).json({
        error: 'License validation failed',
        message: 'Please check your license key and client ID',
        code: 'LICENSE_INVALID'
      });
    }
  });

  // Public routes (no license required)
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Protected routes (license required)
  app.use('/api', licenseValidation);

  // API routes with license validation
  app.get('/api/data', (req, res) => {
    res.json({
      message: 'Data access granted',
      license: {
        clientName: req.license.clientName,
        licenseType: req.license.licenseType,
        daysUntilExpiry: req.license.daysUntilExpiry
      }
    });
  });

  // Feature-specific routes
  app.get('/api/analytics', 
    requireFeature('analytics'),
    (req, res) => {
      res.json({
        message: 'Analytics access granted',
        data: { /* analytics data */ }
      });
    }
  );

  app.post('/api/users',
    checkLicenseLimit('maxUsers'),
    (req, res) => {
      res.json({
        message: 'User created successfully',
        count: req.body.count
      });
    }
  );

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Application error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  return app;
}

/**
 * Usage examples
 */

// Example 1: Basic middleware
const basicMiddleware = createLicenseValidationMiddleware();

// Example 2: Custom configuration
const customMiddleware = createLicenseValidationMiddleware({
  apiUrl: 'https://your-license-server.com/api',
  licenseKeyHeader: 'x-api-license',
  clientIdHeader: 'x-api-client',
  timeout: 5000,
  cacheTime: 600000, // 10 minutes
  skipPaths: ['/health', '/metrics', '/docs']
});

// Example 3: Feature-based access control
const featureMiddleware = requireFeature('database_access');

// Example 4: Limit checking
const userLimitMiddleware = checkLicenseLimit('maxUsers');

module.exports = {
  createLicenseValidationMiddleware,
  requireFeature,
  checkLicenseLimit,
  createExampleApp
};

// Run example app if this file is executed directly
if (require.main === module) {
  const app = createExampleApp();
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Example app running on port ${PORT}`);
    console.log(`📋 Test with headers:`);
    console.log(`   x-license-key: YOUR_LICENSE_KEY`);
    console.log(`   x-client-id: YOUR_CLIENT_ID`);
  });
}

