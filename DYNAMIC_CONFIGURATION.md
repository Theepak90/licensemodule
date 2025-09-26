# 🔧 TORRO DYNAMIC CONFIGURATION SYSTEM

## Overview

The Torro License Management System now features a **fully dynamic configuration system** that replaces all hardcoded values with environment variables and configuration options. This ensures maximum flexibility, security, and maintainability.

## 🚀 Key Features

### ✅ **Fully Dynamic Configuration**
- **No Hardcoded Values**: All configuration is loaded from environment variables
- **Runtime Configuration**: Configuration can be changed without code modifications
- **Environment-Specific**: Different configurations for development, staging, and production
- **Secure Key Generation**: Automatic generation of secure encryption keys and secrets

### ✅ **Comprehensive Configuration Management**
- **Server Configuration**: Port, host, CORS, rate limiting
- **Database Configuration**: MongoDB URI, connection options
- **Security Configuration**: Military-grade security, encryption, JWT
- **Key Rotation Configuration**: Intervals, algorithms, validation
- **Hash Validation Configuration**: Validation intervals, password management
- **Network Security Configuration**: IP whitelisting, geographic validation
- **Risk Scoring Configuration**: Weights and thresholds
- **Logging Configuration**: Log levels, retention, file paths
- **Storage Configuration**: File paths and directory structure

### ✅ **Advanced Security Features**
- **Automatic Key Generation**: Secure encryption keys generated automatically
- **Configuration Validation**: Built-in validation for all configuration options
- **Secure Storage**: Configuration stored securely with proper permissions
- **Backup Management**: Automatic backup of configuration files

## 📁 File Structure

```
├── utils/
│   └── dynamicConfig.js          # Core dynamic configuration class
├── scripts/
│   └── setup-dynamic-config.js   # Configuration setup and management
├── .env                          # Environment variables (generated)
├── .env.backup.*                 # Configuration backups
└── DYNAMIC_CONFIGURATION.md      # This documentation
```

## 🛠️ Usage

### **1. Setup Dynamic Configuration**

```bash
# Basic setup with secure key generation
npm run config:setup

# Interactive setup for production
npm run config:interactive

# Show current configuration
npm run config:show

# Validate current configuration
npm run config:validate
```

### **2. Configuration Commands**

```bash
# Setup with secure keys
node scripts/setup-dynamic-config.js setup

# Interactive setup
node scripts/setup-dynamic-config.js interactive

# Show configuration
node scripts/setup-dynamic-config.js show

# Validate configuration
node scripts/setup-dynamic-config.js validate
```

## 🔧 Configuration Categories

### **🌐 Server Configuration**
```javascript
{
  port: 3001,                    // Server port
  host: 'localhost',             // Server host
  nodeEnv: 'development',        // Environment
  corsOrigin: [...],             // CORS origins
  corsCredentials: true,         // CORS credentials
  corsMethods: [...],            // CORS methods
  corsHeaders: [...],            // CORS headers
  jsonLimit: '10mb'              // JSON payload limit
}
```

### **🗄️ Database Configuration**
```javascript
{
  uri: 'mongodb://localhost:27017/torro_licenses',
  name: 'torro_licenses'
}
```

### **🔐 Security Configuration**
```javascript
{
  enabled: true,                 // Military security enabled
  hardwareBindingRequired: true, // Hardware binding required
  antiTamperingEnabled: true,    // Anti-tampering enabled
  selfDestructionEnabled: true,  // Self-destruction enabled
  securityLevel: 'military'      // Security level
}
```

### **🔄 Key Rotation Configuration**
```javascript
{
  interval: 3600000,             // Rotation interval (ms)
  sleepInterval: 300000,         // Sleep interval (ms)
  keyLength: 32,                 // Key length (bytes)
  algorithm: 'sha256',           // Hashing algorithm
  derivationRounds: 10000,       // PBKDF2 rounds
  maxHistory: 100,               // Max history size
  validationEnabled: true,       // Validation enabled
  integrityCheck: true           // Integrity checking
}
```

### **🔍 Hash Validation Configuration**
```javascript
{
  enabled: true,                 // Hash validation enabled
  algorithm: 'sha256',           // Hash algorithm
  salt: 'torro-hash-salt-2024', // Hash salt
  iterations: 10000,             // PBKDF2 iterations
  length: 64,                    // Hash length
  interval: 30000,               // Validation interval (ms)
  maxMismatchAttempts: 3,        // Max mismatch attempts
  passwordChangeOnMismatch: true, // Auto password change
  passwordLength: 32,            // Password length
  passwordComplexity: 'high'     // Password complexity
}
```

### **🌍 Network Security Configuration**
```javascript
{
  allowedCountries: ['US', 'CA', 'GB', 'DE', 'FR'],
  maxRequestsPerHour: 1000,
  rateLimitWindowMs: 3600000,
  rateLimitMaxRequests: 100,
  rateLimitMessage: 'Too many requests...'
}
```

### **📊 Risk Scoring Configuration**
```javascript
{
  hardwareMismatch: 30,          // Hardware mismatch weight
  ipMismatch: 25,                // IP mismatch weight
  geoMismatch: 20,               // Geo mismatch weight
  debugger: 40,                  // Debugger detection weight
  integrity: 50,                 // Integrity violation weight
  highFrequency: 15,             // High frequency weight
  maxRiskScore: 80               // Max risk score
}
```

### **📝 Logging Configuration**
```javascript
{
  logDir: './logs',              // Log directory
  logFile: 'security.log',       // Log file
  violationsFile: 'violations.log', // Violations file
  metricsFile: 'metrics.json',   // Metrics file
  cleanupInterval: 3600000,      // Cleanup interval (ms)
  retentionDays: 7,              // Retention days
  daemonLogFile: './logs/key-daemon.log',
  daemonLogLevel: 'info'         // Daemon log level
}
```

### **📁 Storage Configuration**
```javascript
{
  keyStoragePath: './keys',      // Key storage path
  keyHistoryPath: './keys/history', // Key history path
  hashStoragePath: './keys/hashes', // Hash storage path
  passwordStoragePath: './keys/passwords' // Password storage path
}
```

## 🔐 Security Features

### **Automatic Key Generation**
- **Encryption Keys**: 32-byte random keys for AES-256-GCM
- **JWT Secrets**: 64-byte random secrets for JWT signing
- **Salt Values**: 32-byte random salts for PBKDF2
- **Military Salts**: 32-byte random salts for military security

### **Configuration Validation**
- **Required Fields**: Validates all required configuration fields
- **Type Checking**: Ensures correct data types for all values
- **Range Validation**: Validates numeric ranges and limits
- **Security Checks**: Validates security-related configurations

### **Secure Storage**
- **Environment Variables**: Configuration stored in .env file
- **Backup Management**: Automatic backup of configuration files
- **Permission Control**: Proper file permissions for sensitive data
- **Encryption**: Sensitive data encrypted at rest

## 🚀 Benefits

### **1. Flexibility**
- **Runtime Configuration**: Change settings without code changes
- **Environment-Specific**: Different configs for different environments
- **Easy Deployment**: Simple configuration management for deployment

### **2. Security**
- **No Hardcoded Secrets**: All secrets generated dynamically
- **Secure Defaults**: Security-first default configurations
- **Validation**: Built-in validation prevents misconfigurations

### **3. Maintainability**
- **Centralized Configuration**: All settings in one place
- **Documentation**: Self-documenting configuration system
- **Version Control**: Configuration changes tracked in version control

### **4. Scalability**
- **Horizontal Scaling**: Easy configuration for multiple instances
- **Load Balancing**: Configuration for load balancer settings
- **Monitoring**: Configuration for monitoring and alerting

## 📋 Environment Variables

### **Server Configuration**
```bash
NODE_ENV=development
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With
JSON_LIMIT=10mb
```

### **Database Configuration**
```bash
MONGODB_URI=mongodb://localhost:27017/torro_licenses
DB_NAME=torro_licenses
```

### **JWT Configuration**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### **Encryption Configuration**
```bash
LICENSE_ENCRYPTION_KEY=your-32-character-encryption-key-change-this
LICENSE_SALT=military-grade-salt-2024
RSA_PRIVATE_KEY=your-rsa-private-key
RSA_PUBLIC_KEY=your-rsa-public-key
```

### **Military Security Configuration**
```bash
MILITARY_SECURITY_ENABLED=true
HARDWARE_BINDING_REQUIRED=true
ANTI_TAMPERING_ENABLED=true
SELF_DESTRUCTION_ENABLED=true
SECURITY_LEVEL=military
```

### **Key Rotation Configuration**
```bash
KEY_ROTATION_INTERVAL=3600000
KEY_DAEMON_SLEEP_INTERVAL=300000
KEY_DAEMON_KEY_LENGTH=32
KEY_DAEMON_ALGORITHM=sha256
KEY_DAEMON_DERIVATION_ROUNDS=10000
KEY_DAEMON_MAX_HISTORY=100
KEY_DAEMON_VALIDATION_ENABLED=true
```

### **Hash Validation Configuration**
```bash
ENABLE_HASH_VALIDATION=true
HASH_VALIDATION_ALGORITHM=sha256
HASH_VALIDATION_SALT=torro-hash-salt-2024
HASH_VALIDATION_ITERATIONS=10000
HASH_VALIDATION_LENGTH=64
HASH_VALIDATION_INTERVAL=30000
MAX_MISMATCH_ATTEMPTS=3
PASSWORD_CHANGE_ON_MISMATCH=true
PASSWORD_LENGTH=32
PASSWORD_COMPLEXITY=high
PASSWORD_CHARSET_HIGH=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?
PASSWORD_CHARSET_MEDIUM=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
PASSWORD_CHARSET_LOW=abcdefghijklmnopqrstuvwxyz0123456789
```

## 🎯 Best Practices

### **1. Configuration Management**
- **Use Environment Variables**: Store sensitive data in environment variables
- **Validate Configuration**: Always validate configuration on startup
- **Backup Configuration**: Keep backups of working configurations
- **Document Changes**: Document all configuration changes

### **2. Security**
- **Generate Secure Keys**: Use the setup script to generate secure keys
- **Rotate Keys Regularly**: Implement key rotation policies
- **Monitor Configuration**: Monitor configuration changes
- **Restrict Access**: Limit access to configuration files

### **3. Deployment**
- **Environment-Specific**: Use different configurations for different environments
- **Secrets Management**: Use proper secrets management in production
- **Configuration Validation**: Validate configuration before deployment
- **Rollback Plan**: Have a rollback plan for configuration changes

## 🔧 Troubleshooting

### **Common Issues**

1. **Configuration Validation Failed**
   - Check all required environment variables are set
   - Verify data types and ranges
   - Run `npm run config:validate` for details

2. **Server Won't Start**
   - Check port availability
   - Verify database connection
   - Check configuration syntax

3. **Security Issues**
   - Regenerate secure keys
   - Check file permissions
   - Validate security settings

### **Debug Commands**

```bash
# Show current configuration
npm run config:show

# Validate configuration
npm run config:validate

# Check server health
curl http://localhost:3001/api/health

# Check daemon status
npm run daemon:status
```

## 📚 Examples

### **Development Configuration**
```bash
NODE_ENV=development
PORT=3001
MILITARY_SECURITY_ENABLED=false
HASH_VALIDATION_ENABLED=false
```

### **Production Configuration**
```bash
NODE_ENV=production
PORT=80
MILITARY_SECURITY_ENABLED=true
HASH_VALIDATION_ENABLED=true
SELF_DESTRUCTION_ENABLED=true
```

### **Testing Configuration**
```bash
NODE_ENV=test
PORT=3002
MONGODB_URI=mongodb://localhost:27017/torro_licenses_test
MILITARY_SECURITY_ENABLED=false
```

## 🎉 Conclusion

The Torro Dynamic Configuration System provides:

- ✅ **Complete Flexibility**: No hardcoded values
- ✅ **Enhanced Security**: Automatic secure key generation
- ✅ **Easy Management**: Simple configuration commands
- ✅ **Production Ready**: Environment-specific configurations
- ✅ **Maintainable**: Centralized configuration management
- ✅ **Scalable**: Easy horizontal scaling
- ✅ **Secure**: Built-in security features
- ✅ **Validated**: Configuration validation and error handling

**🚀 Your Torro License Management System is now fully dynamic and production-ready!**
