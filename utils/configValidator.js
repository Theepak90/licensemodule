const crypto = require('crypto');

class ConfigValidator {
  constructor() {
    this.requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'LICENSE_ENCRYPTION_KEY'
    ];
    
    this.optionalVars = [
      'PORT',
      'NODE_ENV',
      'MILITARY_SECURITY_ENABLED',
      'HARDWARE_BINDING_REQUIRED',
      'ANTI_TAMPERING_ENABLED',
      'SELF_DESTRUCTION_ENABLED',
      'KEY_ROTATION_INTERVAL',
      'DEBUGGER_THRESHOLD',
      'SECURE_DELETE_PASSES',
      'LICENSE_KEY_PREFIX',
      'LICENSE_RANDOM_LENGTH',
      'LICENSE_CHECKSUM_LENGTH',
      'CLIENT_ID_PREFIX',
      'CLIENT_ID_SUFFIX_LENGTH',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS',
      'JSON_LIMIT',
      'LICENSE_CHECK_CRON',
      'LICENSE_CLEANUP_CRON',
      'SECURITY_LOG_DIR',
      'LOG_RETENTION_DAYS',
      'TORRO_API_URL',
      'TORRO_GRACE_PERIOD',
      'TORRO_VALIDATION_INTERVAL'
    ];
    
    this.validationRules = {
      PORT: { type: 'number', min: 1, max: 65535 },
      NODE_ENV: { type: 'string', values: ['development', 'production', 'test'] },
      MILITARY_SECURITY_ENABLED: { type: 'boolean' },
      HARDWARE_BINDING_REQUIRED: { type: 'boolean' },
      ANTI_TAMPERING_ENABLED: { type: 'boolean' },
      SELF_DESTRUCTION_ENABLED: { type: 'boolean' },
      KEY_ROTATION_INTERVAL: { type: 'number', min: 60000, max: 86400000 },
      DEBUGGER_THRESHOLD: { type: 'number', min: 10, max: 1000 },
      SECURE_DELETE_PASSES: { type: 'number', min: 1, max: 20 },
      LICENSE_RANDOM_LENGTH: { type: 'number', min: 8, max: 64 },
      LICENSE_CHECKSUM_LENGTH: { type: 'number', min: 4, max: 32 },
      CLIENT_ID_SUFFIX_LENGTH: { type: 'number', min: 4, max: 20 },
      RATE_LIMIT_WINDOW_MS: { type: 'number', min: 60000, max: 3600000 },
      RATE_LIMIT_MAX_REQUESTS: { type: 'number', min: 1, max: 10000 },
      JSON_LIMIT: { type: 'string', pattern: /^\d+(mb|kb|gb)$/i },
      LOG_RETENTION_DAYS: { type: 'number', min: 1, max: 365 },
      TORRO_GRACE_PERIOD: { type: 'number', min: 60000, max: 3600000 },
      TORRO_VALIDATION_INTERVAL: { type: 'number', min: 10000, max: 3600000 }
    };
  }

  validate() {
    const errors = [];
    const warnings = [];
    const config = {};

    // Check required variables
    for (const varName of this.requiredVars) {
      const value = process.env[varName];
      if (!value) {
        errors.push(`Required environment variable ${varName} is not set`);
      } else {
        config[varName] = value;
      }
    }

    // Check optional variables with validation
    for (const varName of this.optionalVars) {
      const value = process.env[varName];
      if (value !== undefined) {
        const rule = this.validationRules[varName];
        if (rule) {
          const validation = this.validateValue(value, rule, varName);
          if (validation.error) {
            errors.push(validation.error);
          } else if (validation.warning) {
            warnings.push(validation.warning);
          }
        }
        config[varName] = value;
      }
    }

    // Validate specific configurations
    this.validateSecurityConfig(config, errors, warnings);
    this.validateDatabaseConfig(config, errors, warnings);
    this.validateCronConfig(config, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  validateValue(value, rule, varName) {
    // Type validation
    if (rule.type === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        return { error: `${varName} must be a number, got: ${value}` };
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return { error: `${varName} must be at least ${rule.min}, got: ${numValue}` };
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return { error: `${varName} must be at most ${rule.max}, got: ${numValue}` };
      }
    } else if (rule.type === 'boolean') {
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        return { error: `${varName} must be a boolean (true/false), got: ${value}` };
      }
    } else if (rule.type === 'string') {
      if (rule.values && !rule.values.includes(value)) {
        return { error: `${varName} must be one of: ${rule.values.join(', ')}, got: ${value}` };
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return { error: `${varName} format is invalid, got: ${value}` };
      }
    }

    return { valid: true };
  }

  validateSecurityConfig(config, errors, warnings) {
    // Validate JWT secret strength
    if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }

    // Validate encryption key
    if (config.LICENSE_ENCRYPTION_KEY && config.LICENSE_ENCRYPTION_KEY.length < 32) {
      errors.push('LICENSE_ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Validate military security configuration
    if (config.MILITARY_SECURITY_ENABLED === 'true') {
      if (config.HARDWARE_BINDING_REQUIRED !== 'true') {
        warnings.push('Hardware binding is recommended when military security is enabled');
      }
      if (config.ANTI_TAMPERING_ENABLED !== 'true') {
        warnings.push('Anti-tampering is recommended when military security is enabled');
      }
    }

    // Validate risk scoring weights
    const riskWeights = [
      'RISK_WEIGHT_HARDWARE_MISMATCH',
      'RISK_WEIGHT_IP_MISMATCH',
      'RISK_WEIGHT_GEO_MISMATCH',
      'RISK_WEIGHT_DEBUGGER',
      'RISK_WEIGHT_INTEGRITY',
      'RISK_WEIGHT_HIGH_FREQUENCY'
    ];

    let totalWeight = 0;
    for (const weight of riskWeights) {
      const value = parseInt(process.env[weight]);
      if (!isNaN(value)) {
        totalWeight += value;
      }
    }

    if (totalWeight > 0 && totalWeight > 200) {
      warnings.push('Total risk weights exceed 200, which may cause excessive risk scoring');
    }
  }

  validateDatabaseConfig(config, errors, warnings) {
    if (config.MONGODB_URI) {
      if (!config.MONGODB_URI.startsWith('mongodb://') && !config.MONGODB_URI.startsWith('mongodb+srv://')) {
        errors.push('MONGODB_URI must be a valid MongoDB connection string');
      }
    }
  }

  validateCronConfig(config, errors, warnings) {
    const cronPatterns = [
      'LICENSE_CHECK_CRON',
      'LICENSE_CLEANUP_CRON'
    ];

    for (const pattern of cronPatterns) {
      const value = process.env[pattern];
      if (value && !this.isValidCronPattern(value)) {
        errors.push(`${pattern} must be a valid cron pattern, got: ${value}`);
      }
    }
  }

  isValidCronPattern(pattern) {
    // Basic cron pattern validation
    const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([012]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
    return cronRegex.test(pattern);
  }

  generateSecureConfig() {
    return {
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      LICENSE_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
      LICENSE_SALT: crypto.randomBytes(16).toString('hex'),
      RSA_PRIVATE_KEY: 'Generated via: openssl genrsa -out private.pem 4096',
      RSA_PUBLIC_KEY: 'Generated via: openssl rsa -in private.pem -pubout -out public.pem'
    };
  }

  getRecommendedConfig() {
    return {
      // Production recommendations
      NODE_ENV: 'production',
      PORT: '443',
      JWT_SECRET: '64-character-random-string-generated-securely',
      LICENSE_ENCRYPTION_KEY: '32-character-random-string-generated-securely',
      MILITARY_SECURITY_ENABLED: 'true',
      HARDWARE_BINDING_REQUIRED: 'true',
      ANTI_TAMPERING_ENABLED: 'true',
      SELF_DESTRUCTION_ENABLED: 'true',
      KEY_ROTATION_INTERVAL: '3600000',
      SECURE_DELETE_PASSES: '7',
      RATE_LIMIT_MAX_REQUESTS: '100',
      LOG_RETENTION_DAYS: '30',
      TORRO_GRACE_PERIOD: '300000',
      TORRO_VALIDATION_INTERVAL: '60000'
    };
  }

  printValidationReport(validation) {
    console.log('\n🔧 TORRO CONFIGURATION VALIDATION REPORT');
    console.log('==========================================');

    if (validation.valid) {
      console.log('✅ Configuration is valid!');
    } else {
      console.log('❌ Configuration has errors:');
      validation.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    console.log('\n📊 Configuration Summary:');
    console.log(`   • Required variables: ${this.requiredVars.length}`);
    console.log(`   • Optional variables: ${this.optionalVars.length}`);
    console.log(`   • Errors: ${validation.errors.length}`);
    console.log(`   • Warnings: ${validation.warnings.length}`);

    if (!validation.valid) {
      console.log('\n🔧 To fix configuration issues:');
      console.log('   1. Copy env.example to .env');
      console.log('   2. Update the .env file with your values');
      console.log('   3. Run this validation again');
    }
  }
}

module.exports = ConfigValidator;
