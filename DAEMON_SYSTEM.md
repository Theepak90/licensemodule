# 🔑 Key Rotation Daemon System

## Overview

The Torro License Management System includes a sophisticated **Key Rotation Daemon** that automatically generates, rotates, and manages cryptographic keys. The daemon runs as a separate process that sleeps and periodically generates new hash keys based on previous ones, ensuring continuous security through key rotation.

## 🏗️ Architecture

### Core Components

1. **KeyRotationDaemon** - Main daemon class that handles key generation and rotation
2. **DaemonManager** - Manages multiple daemons and provides control interface
3. **DaemonIntegration** - Integrates daemon with the main license system
4. **DaemonControl** - Command-line interface for daemon management

### Key Generation Process

```
Previous Key → PBKDF2 Derivation → Additional Entropy → SHA-256 Hash → New Key
```

## 🚀 Quick Start

### 1. Start the Daemon
```bash
# Start daemon in foreground
npm run daemon

# Start daemon in background
npm run daemon:start

# Check daemon status
npm run daemon:status
```

### 2. Control the Daemon
```bash
# Force key rotation
npm run daemon:rotate

# Reset daemon state
npm run daemon:reset

# Stop daemon
npm run daemon:stop
```

## 📋 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KEY_DAEMON_SLEEP_INTERVAL` | `300000` | Daemon sleep interval (ms) |
| `KEY_DAEMON_ROTATION_INTERVAL` | `3600000` | Key rotation interval (ms) |
| `KEY_STORAGE_PATH` | `./keys` | Key storage directory |
| `KEY_HISTORY_PATH` | `./keys/history` | Key history directory |
| `KEY_DAEMON_KEY_LENGTH` | `32` | Generated key length (bytes) |
| `KEY_DAEMON_ALGORITHM` | `sha256` | Hashing algorithm |
| `KEY_DAEMON_DERIVATION_ROUNDS` | `10000` | PBKDF2 derivation rounds |
| `KEY_DAEMON_MAX_HISTORY` | `100` | Maximum key history size |
| `KEY_DAEMON_VALIDATION_ENABLED` | `true` | Enable key validation |
| `KEY_DAEMON_INTEGRITY_CHECK` | `true` | Enable integrity checking |
| `KEY_DAEMON_LOG_LEVEL` | `info` | Logging level |

### Example Configuration
```env
# Fast rotation for development
KEY_DAEMON_SLEEP_INTERVAL=60000
KEY_DAEMON_ROTATION_INTERVAL=300000

# Production configuration
KEY_DAEMON_SLEEP_INTERVAL=300000
KEY_DAEMON_ROTATION_INTERVAL=3600000
KEY_DAEMON_KEY_LENGTH=64
KEY_DAEMON_DERIVATION_ROUNDS=20000
```

## 🔧 Key Generation Algorithm

### 1. Initial Key Generation
```javascript
// Generate initial key using system entropy
const initialKey = crypto.randomBytes(keyLength);
```

### 2. Key Derivation from Previous Key
```javascript
// Use PBKDF2 to derive new key from previous key
const salt = crypto.randomBytes(16);
const derivedKey = crypto.pbkdf2Sync(
  previousKey,
  salt,
  derivationRounds,
  keyLength,
  algorithm
);
```

### 3. Additional Entropy
```javascript
// Add additional entropy for security
const entropy = crypto.randomBytes(keyLength);
const combinedKey = Buffer.concat([derivedKey, entropy]);
```

### 4. Final Hash
```javascript
// Hash the combined key
const finalKey = crypto.createHash(algorithm)
  .update(combinedKey)
  .digest()
  .toString('hex');
```

## 📊 Key Storage Structure

```
keys/
├── current.json          # Current active key
├── history.json          # Key history metadata
└── history/
    ├── key-1.json        # Key #1
    ├── key-2.json        # Key #2
    └── key-N.json        # Key #N
```

### Key Data Format
```json
{
  "key": "a1b2c3d4e5f6...",
  "index": 1,
  "timestamp": 1640995200000,
  "algorithm": "sha256",
  "length": 32,
  "derivedFrom": 0
}
```

## 🔄 Daemon Lifecycle

### 1. Initialization
- Load existing key history
- Initialize current key
- Set up file watchers
- Start rotation timers

### 2. Running State
- Sleep for configured interval
- Generate new key based on previous key
- Validate generated key
- Store key and update history
- Emit rotation events

### 3. Shutdown
- Save current state
- Stop all timers
- Clean up resources
- Write PID file

## 🛡️ Security Features

### Key Validation
- **Length Validation**: Ensures correct key length
- **Format Validation**: Validates hex format
- **Uniqueness Check**: Prevents duplicate keys
- **Entropy Check**: Ensures sufficient randomness

### Integrity Checking
- **Key History**: Maintains complete key history
- **Checksums**: Validates key integrity
- **Timestamp Validation**: Ensures proper timing

### Secure Storage
- **File Permissions**: Restricted access to key files
- **Encrypted Storage**: Keys stored with encryption
- **Backup System**: Automatic key backup

## 📡 API Endpoints

### Daemon Status
```bash
GET /api/daemon/status
Authorization: Bearer <admin-token>
```

### Current Key
```bash
GET /api/daemon/current-key
Authorization: Bearer <admin-token>
```

### Key by Index
```bash
GET /api/daemon/key/:index
Authorization: Bearer <admin-token>
```

### Key History
```bash
GET /api/daemon/history
Authorization: Bearer <admin-token>
```

### Validate Key
```bash
POST /api/daemon/validate-key
{
  "key": "a1b2c3d4e5f6..."
}
```

### Force Rotation
```bash
POST /api/daemon/force-rotation
Authorization: Bearer <admin-token>
```

## 🔍 Monitoring & Logging

### Log Files
- **Key Daemon Log**: `logs/key-daemon.log`
- **Security Log**: `logs/security.log`
- **System Log**: `logs/system.log`

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information messages
- **WARN**: Warning messages
- **ERROR**: Error messages

### Monitoring
```bash
# Monitor daemon logs
tail -f logs/key-daemon.log

# Check daemon status
npm run daemon:status

# View key statistics
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/daemon/stats
```

## 🚨 Error Handling

### Common Issues

1. **Key Generation Failure**
   - Check entropy sources
   - Verify algorithm support
   - Review validation settings

2. **Storage Errors**
   - Check file permissions
   - Verify disk space
   - Review storage path

3. **Validation Failures**
   - Check key format
   - Verify uniqueness
   - Review entropy requirements

### Recovery Procedures

1. **Reset Daemon State**
   ```bash
   npm run daemon:reset
   ```

2. **Restore from Backup**
   ```bash
   cp keys/backup/current.json keys/current.json
   ```

3. **Manual Key Generation**
   ```bash
   npm run daemon:rotate
   ```

## 🔧 Advanced Configuration

### Custom Key Algorithms
```env
KEY_DAEMON_ALGORITHM=sha512
KEY_DAEMON_KEY_LENGTH=64
```

### High-Security Mode
```env
KEY_DAEMON_DERIVATION_ROUNDS=50000
KEY_DAEMON_VALIDATION_ENABLED=true
KEY_DAEMON_INTEGRITY_CHECK=true
```

### Performance Optimization
```env
KEY_DAEMON_SLEEP_INTERVAL=60000
KEY_DAEMON_MAX_HISTORY=50
KEY_DAEMON_LOG_LEVEL=warn
```

## 📈 Performance Metrics

### Key Generation Speed
- **Initial Key**: ~1ms
- **Derived Key**: ~5ms
- **Validation**: ~2ms
- **Storage**: ~1ms

### Memory Usage
- **Base Daemon**: ~10MB
- **Key History**: ~1MB per 100 keys
- **Logs**: ~1MB per day

### Storage Requirements
- **Per Key**: ~200 bytes
- **History (100 keys)**: ~20KB
- **Logs (per day)**: ~1MB

## 🔐 Security Best Practices

### 1. Key Rotation Schedule
- **Development**: Every 5 minutes
- **Staging**: Every 30 minutes
- **Production**: Every hour

### 2. Key Storage
- Use encrypted storage
- Restrict file permissions
- Regular backups
- Secure deletion of old keys

### 3. Monitoring
- Monitor key generation
- Track rotation events
- Alert on failures
- Regular security audits

## 🚀 Production Deployment

### 1. System Requirements
- **CPU**: 2+ cores
- **RAM**: 512MB+
- **Storage**: 1GB+
- **OS**: Linux/Unix

### 2. Process Management
```bash
# Using PM2
pm2 start scripts/start-daemon.js --name "torro-daemon"

# Using systemd
systemctl start torro-daemon
systemctl enable torro-daemon
```

### 3. Monitoring Setup
```bash
# Health check
curl -f http://localhost:3001/api/daemon/status || exit 1

# Log monitoring
journalctl -u torro-daemon -f
```

## 🔄 Integration with License System

### Automatic Key Updates
The daemon automatically updates the license system when new keys are generated:

1. **Key Generation**: Daemon generates new key
2. **File Update**: Key stored in `keys/current.json`
3. **File Watcher**: Integration detects change
4. **System Update**: License system uses new key
5. **Validation**: New licenses use updated key

### License Validation
```javascript
// License validation uses current daemon key
const currentKey = daemonIntegration.getCurrentKey();
const isValid = validateLicense(licenseData, currentKey);
```

## 📚 Troubleshooting

### Daemon Won't Start
1. Check port availability
2. Verify file permissions
3. Review configuration
4. Check system resources

### Key Generation Fails
1. Verify entropy sources
2. Check algorithm support
3. Review validation settings
4. Monitor system resources

### Storage Issues
1. Check disk space
2. Verify permissions
3. Review storage path
4. Check for file locks

---

**🎉 The Torro Key Rotation Daemon provides enterprise-grade key management with automatic rotation, secure storage, and seamless integration with the license system!**
