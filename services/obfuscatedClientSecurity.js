/**
 * Military-Grade Obfuscated Client Security
 * 
 * This file contains heavily obfuscated and protected client-side code
 * with anti-debugging, anti-tampering, and anti-reverse engineering features.
 * 
 * WARNING: This code is intentionally obfuscated for security purposes.
 */

const crypto = require('crypto');
const os = require('os');

// Obfuscated variable names and function names
const _0x1a2b = 'TORRO-MIL-SECURITY-2024';
const _0x3c4d = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64];
const _0x5e6f = Buffer.from(_0x3c4d).toString();
const _0x7g8h = process.env.NODE_ENV === 'production';

/**
 * Anti-Debugging and Anti-Tampering Class
 */
class _0x9i0j {
  constructor() {
    this._0xa1b2 = Date.now();
    this._0xc3d4 = this._0xe5f6();
    this._0xg7h8 = false;
    this._0xi9j0 = [];
    
    // Initialize anti-debugging measures
    this._0xk1l2();
    this._0xm3n4();
    this._0xo5p6();
  }

  /**
   * Obfuscated hardware fingerprinting
   */
  _0xe5f6() {
    const _0xq7r8 = [
      os.cpus()[0].model,
      os.totalmem(),
      os.platform(),
      os.arch(),
      os.hostname(),
      os.userInfo().username
    ];

    const _0xs9t0 = crypto
      .createHash('sha512')
      .update(_0xq7r8.join('|'))
      .digest('hex');

    return {
      _0xu1v2: _0xs9t0,
      _0xw3x4: _0xq7r8.map(_0xy5z6 => 
        crypto.createHash('sha256').update(_0xy5z6.toString()).digest('hex')
      ),
      _0xa7b8: Date.now()
    };
  }

  /**
   * Anti-debugging: Detect debugger presence
   */
  _0xk1l2() {
    const _0xc9d0 = () => {
      const _0xe1f2 = Date.now();
      debugger; // This will trigger if debugger is attached
      const _0xg3h4 = Date.now() - _0xe1f2;
      
      if (_0xg3h4 > 100) { // If execution was paused
        this._0xi9j0.push({
          type: 'debugger_detected',
          timestamp: Date.now(),
          delay: _0xg3h4
        });
        this._0xg7h8 = true;
      }
    };

    // Run anti-debugging checks periodically
    setInterval(_0xc9d0, 5000 + Math.random() * 10000);
  }

  /**
   * Anti-tampering: Memory integrity checks
   */
  _0xm3n4() {
    const _0xo5p6 = () => {
      // Check if critical functions have been modified
      const _0xq7r8 = this._0xe5f6._0xu1v2;
      const _0xs9t0 = crypto.createHash('sha256').update(this._0xe5f6.toString()).digest('hex');
      
      if (_0xs9t0 !== _0xq7r8) {
        this._0xi9j0.push({
          type: 'function_tampering',
          timestamp: Date.now(),
          expected: _0xq7r8,
          actual: _0xs9t0
        });
        this._0xg7h8 = true;
      }
    };

    setInterval(_0xo5p6, 3000 + Math.random() * 5000);
  }

  /**
   * Anti-reverse engineering: Code obfuscation
   */
  _0xo5p6() {
    // Create decoy functions to confuse reverse engineers
    const _0xu1v2 = () => {
      const _0xw3x4 = [0x66, 0x61, 0x6b, 0x65];
      return Buffer.from(_0xw3x4).toString();
    };

    const _0xy5z6 = () => {
      return Math.random() * 1000;
    };

    // Add noise to make static analysis harder
    const _0xa7b8 = Array.from({ length: 1000 }, () => Math.random());
    
    // Hide real functionality among decoys
    this._0xb9c0 = _0xu1v2;
    this._0xd1e2 = _0xy5z6;
    this._0xf3g4 = _0xa7b8;
  }

  /**
   * Get security status
   */
  _0xh5i6() {
    return {
      _0xj7k8: this._0xg7h8,
      _0xl9m0: this._0xi9j0,
      _0xn1o2: this._0xc3d4._0xu1v2.substring(0, 16) + '...',
      _0xp3q4: Date.now() - this._0xa1b2
    };
  }
}

/**
 * Military-Grade License Validator with Obfuscation
 */
class _0xr5s6 {
  constructor(_0xt7u8, _0xv9w0, _0xx1y2 = {}) {
    this._0xz3a4 = _0xt7u8;
    this._0xb5c6 = _0xv9w0;
    this._0xd7e8 = _0xx1y2._0xf9g0 || 'http://localhost:5000/api';
    this._0xh1i2 = false;
    this._0xj3k4 = null;
    this._0xl5m6 = new _0x9i0j();
    this._0xn7o8 = [];
    this._0xp9q0 = 0;
    this._0xr1s2 = 0;
    
    // Initialize security measures
    this._0xt3u4();
    this._0xv5w6();
  }

  /**
   * Obfuscated license validation
   */
  async _0xx7y8() {
    try {
      // Check security status first
      const _0xz9a0 = this._0xl5m6._0xh5i6();
      if (_0xz9a0._0xj7k8) {
        this._0xp9q0++;
        this._0xr1s2++;
        throw new Error('Security violation detected');
      }

      // Create obfuscated request payload
      const _0xb1c2 = this._0xd3e4({
        _0xf5g6: this._0xz3a4,
        _0xh7i8: this._0xb5c6,
        _0xj9k0: this._0xl1m2(),
        _0xn3o4: _0xz9a0
      });

      // Send request with additional security headers
      const _0xp5q6 = await this._0xr7s8(_0xb1c2);
      
      if (_0xp5q6._0xt9u0) {
        this._0xh1i2 = true;
        this._0xj3k4 = _0xp5q6._0xv1w2;
        this._0xp9q0 = 0; // Reset failure count on success
      } else {
        this._0xh1i2 = false;
        this._0xr1s2++;
      }

      return this._0xh1i2;

    } catch (_0xy3z4) {
      this._0xr1s2++;
      this._0xn7o8.push({
        _0xa5b6: Date.now(),
        _0xc7d8: _0xy3z4.message,
        _0xe9f0: this._0xr1s2
      });
      
      // Implement exponential backoff
      const _0xg1h2 = Math.min(1000 * Math.pow(2, this._0xr1s2), 30000);
      await new Promise(resolve => setTimeout(resolve, _0xg1h2));
      
      return false;
    }
  }

  /**
   * Obfuscated payload encryption
   */
  _0xd3e4(_0xf5g6) {
    const _0xh7i8 = crypto.randomBytes(16);
    const _0xi9j0 = crypto.randomBytes(12);
    
    const _0xk1l2 = crypto.createCipherGCM('aes-256-gcm', 
      crypto.pbkdf2Sync(_0x1a2b, _0xh7i8, 100000, 32, 'sha512'), 
      _0xi9j0
    );
    
    let _0xm3n4 = _0xk1l2.update(JSON.stringify(_0xf5g6), 'utf8', 'hex');
    _0xm3n4 += _0xk1l2.final('hex');
    const _0xo5p6 = _0xk1l2.getAuthTag();
    
    return {
      _0xq7r8: _0xm3n4,
      _0xs9t0: _0xh7i8.toString('hex'),
      _0xu1v2: _0xi9j0.toString('hex'),
      _0xw3x4: _0xo5p6.toString('hex')
    };
  }

  /**
   * Obfuscated network request
   */
  async _0xr7s8(_0xt9u0) {
    const _0xv1w2 = require('axios');
    
    const _0xx3y4 = await _0xv1w2.post(`${this._0xd7e8}/licenses/validate`, _0xt9u0, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Torro-Security': this._0xz5a6(),
        'X-Torro-Timestamp': Date.now().toString(),
        'X-Torro-Checksum': this._0xb7c8(_0xt9u0),
        'User-Agent': this._0xd9e0()
      }
    });

    return _0xx3y4.data;
  }

  /**
   * Generate security token
   */
  _0xz5a6() {
    const _0xf1g2 = Date.now();
    const _0xh3i4 = this._0xl5m6._0xc3d4._0xu1v2;
    return crypto.createHash('sha256').update(_0xf1g2 + _0xh3i4).digest('hex');
  }

  /**
   * Generate request checksum
   */
  _0xb7c8(_0xd9e0) {
    return crypto.createHash('sha256').update(JSON.stringify(_0xd9e0)).digest('hex');
  }

  /**
   * Generate obfuscated user agent
   */
  _0xd9e0() {
    const _0xf1g2 = ['Mozilla', 'Chrome', 'Safari', 'Firefox'];
    const _0xh3i4 = Math.floor(Math.random() * _0xf1g2.length);
    return `${_0xf1g2[_0xh3i4]}/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`;
  }

  /**
   * Get hardware fingerprint
   */
  _0xl1m2() {
    return this._0xl5m6._0xc3d4;
  }

  /**
   * Initialize security monitoring
   */
  _0xt3u4() {
    // Monitor for debugging attempts
    process.on('SIGUSR1', () => {
      this._0xn7o8.push({
        _0xa5b6: Date.now(),
        _0xc7d8: 'Debug signal detected',
        _0xe9f0: this._0xr1s2
      });
    });

    // Monitor for unexpected exits
    process.on('exit', (code) => {
      if (code !== 0) {
        this._0xn7o8.push({
          _0xa5b6: Date.now(),
          _0xc7d8: `Unexpected exit with code ${code}`,
          _0xe9f0: this._0xr1s2
        });
      }
    });
  }

  /**
   * Initialize periodic validation
   */
  _0xv5w6() {
    // Initial validation
    this._0xx7y8();

    // Periodic validation with random intervals
    const _0xy7z8 = () => {
      const _0xa9b0 = 30000 + Math.random() * 30000; // 30-60 seconds
      setTimeout(async () => {
        await this._0xx7y8();
        _0xy7z8();
      }, _0xa9b0);
    };

    _0xy7z8();
  }

  /**
   * Get license status
   */
  _0xc1d2() {
    return {
      _0xe3f4: this._0xh1i2,
      _0xg5h6: this._0xj3k4,
      _0xi7j8: this._0xl5m6._0xh5i6(),
      _0xk9l0: this._0xn7o8.slice(-10), // Last 10 events
      _0xm1n2: this._0xr1s2
    };
  }

  /**
   * Force validation check
   */
  async _0xo3p4() {
    return await this._0xx7y8();
  }
}

/**
 * Self-Destruction with Military-Grade Security
 */
class _0xq5r6 extends _0xr5s6 {
  constructor(_0xs7t8, _0xu9v0, _0xw1x2 = {}) {
    super(_0xs7t8, _0xu9v0, _0xw1x2);
    this._0xy3z4 = false;
    this._0xa5b6 = _0xw1x2._0xc7d8 || 300000; // 5 minutes grace period
    this._0xe9f0 = _0xw1x2._0xf1g2 || '.torro_license_destroyed';
  }

  /**
   * Override validation to trigger destruction
   */
  async _0xx7y8() {
    const _0xh3i4 = await super._0xx7y8();
    
    if (!_0xh3i4 && !this._0xy3z4) {
      this._0xj5k6();
    }
    
    return _0xh3i4;
  }

  /**
   * Trigger self-destruction sequence
   */
  _0xj5k6() {
    if (this._0xy3z4) return;

    this._0xy3z4 = true;
    console.log('🚨 MILITARY-GRADE SELF-DESTRUCTION INITIATED');
    
    // Stop all monitoring
    process.removeAllListeners('SIGUSR1');
    
    // Create destruction lock file
    this._0xl7m8();
    
    // Notify about destruction
    if (this._0xn9o0) {
      this._0xn9o0(false, this._0xj3k4, { selfDestruct: true });
    }
    
    // Grace period before destruction
    setTimeout(() => {
      this._0xp1q2();
    }, this._0xa5b6);
  }

  /**
   * Create destruction lock file
   */
  _0xl7m8() {
    try {
      const _0xr3s4 = {
        _0xt5u6: true,
        _0xv7w8: this._0xj3k4?._0xw9x0,
        _0xy1z2: this._0xb5c6,
        _0xa3b4: this._0xz3a4.substring(0, 20) + '...',
        _0xc5d6: new Date().toISOString(),
        _0xe7f8: this._0xa5b6,
        _0xg9h0: this._0xl5m6._0xc3d4._0xu1v2.substring(0, 32)
      };

      const _0xi1j2 = require('fs');
      _0xi1j2.writeFileSync(this._0xe9f0, JSON.stringify(_0xr3s4, null, 2));
      console.log(`📄 Destruction lock created: ${this._0xe9f0}`);
    } catch (_0xk3l4) {
      console.error('❌ Failed to create destruction lock:', _0xk3l4.message);
    }
  }

  /**
   * Perform military-grade self-destruction
   */
  _0xp1q2() {
    console.log('💥 MILITARY-GRADE SELF-DESTRUCTION EXECUTING...');
    
    try {
      const _0xm5n6 = require('fs');
      const _0xo7p8 = require('path');
      
      // Remove critical application files with multiple passes
      const _0xq9r0 = [
        'config.json', 'database.json', 'api-keys.json',
        'app.js', 'server.js', 'index.js',
        'package.json', 'package-lock.json',
        '.env', '.env.local', '.env.production'
      ];

      _0xq9r0.forEach(_0xs1t2 => {
        const _0xu3v4 = _0xo7p8.join(process.cwd(), _0xs1t2);
        if (_0xm5n6.existsSync(_0xu3v4)) {
          // Multiple overwrites for secure deletion
          const _0xw5x6 = _0xm5n6.readFileSync(_0xu3v4);
          for (let _0xy7z8 = 0; _0xy7z8 < 3; _0xy7z8++) {
            _0xm5n6.writeFileSync(_0xu3v4, crypto.randomBytes(_0xw5x6.length));
          }
          _0xm5n6.unlinkSync(_0xu3v4);
          console.log(`🗑️  Securely destroyed: ${_0xs1t2}`);
        }
      });

      // Clear environment variables
      Object.keys(process.env).forEach(_0xa9b0 => {
        if (_0xa9b0.includes('TORRO') || _0xa9b0.includes('LICENSE')) {
          delete process.env[_0xa9b0];
        }
      });

      // Clear memory (attempt)
      if (global.gc) {
        global.gc();
      }

      console.log('💥 MILITARY-GRADE SELF-DESTRUCTION COMPLETE');
      
    } catch (_0xc1d2) {
      console.error('❌ Error during self-destruction:', _0xc1d2.message);
    } finally {
      // Force exit
      process.exit(1);
    }
  }

  /**
   * Check if application should start
   */
  static _0xe3f4() {
    const _0xg5h6 = require('fs');
    return !_0xg5h6.existsSync('.torro_license_destroyed');
  }

  /**
   * Remove destruction lock (for testing only)
   */
  static _0xi7j8() {
    const _0xk9l0 = require('fs');
    if (_0xk9l0.existsSync('.torro_license_destroyed')) {
      _0xk9l0.unlinkSync('.torro_license_destroyed');
      console.log('🔓 Destruction lock removed');
    }
  }
}

// Export obfuscated classes
module.exports = {
  TorroMilitaryLicenseValidator: _0xr5s6,
  TorroMilitarySelfDestruct: _0xq5r6,
  TorroAntiTamper: _0x9i0j
};
