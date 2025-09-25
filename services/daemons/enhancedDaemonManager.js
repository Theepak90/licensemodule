const EnhancedKeyRotationDaemon = require('./enhancedKeyRotationDaemon');
const path = require('path');

class EnhancedDaemonManager {
  constructor() {
    this.daemons = new Map();
    this.isRunning = false;
  }

  // ==================== ENHANCED DAEMON MANAGEMENT ====================

  async startEnhancedKeyRotationDaemon(options = {}) {
    const daemonId = 'enhancedKeyRotation';
    
    if (this.daemons.has(daemonId)) {
      console.log('Enhanced key rotation daemon is already running');
      return this.daemons.get(daemonId);
    }

    const daemon = new EnhancedKeyRotationDaemon(options);
    
    // Set up enhanced event listeners
    daemon.on('started', () => {
      console.log('🔑 Enhanced key rotation daemon started');
    });
    
    daemon.on('stopped', () => {
      console.log('🔑 Enhanced key rotation daemon stopped');
    });
    
    daemon.on('keyRotated', (data) => {
      const hashStatus = data.hashValidationEnabled ? 
        (data.hashValidationRunning ? '✅' : '❌') : '⚪';
      console.log(`🔑 Key rotated: index ${data.index}, hash validation ${hashStatus}`);
    });
    
    daemon.on('hashMismatch', (data) => {
      console.log(`⚠️  Hash mismatch detected: ${data.mismatchCount}/${data.maxMismatchAttempts}`);
    });
    
    daemon.on('passwordChanged', (data) => {
      console.log('�� Password changed due to hash mismatch');
    });
    
    daemon.on('error', (error) => {
      console.error('🔑 Enhanced daemon error:', error.message);
    });

    await daemon.start();
    this.daemons.set(daemonId, daemon);
    
    return daemon;
  }

  async stopEnhancedKeyRotationDaemon() {
    const daemonId = 'enhancedKeyRotation';
    const daemon = this.daemons.get(daemonId);
    
    if (!daemon) {
      console.log('Enhanced key rotation daemon is not running');
      return;
    }

    await daemon.stop();
    this.daemons.delete(daemonId);
  }

  async startAllDaemons() {
    console.log('🚀 Starting all enhanced daemons...');
    
    try {
      // Start enhanced key rotation daemon
      await this.startEnhancedKeyRotationDaemon();
      
      this.isRunning = true;
      console.log('✅ All enhanced daemons started successfully');
      
    } catch (error) {
      console.error('❌ Error starting enhanced daemons:', error.message);
      throw error;
    }
  }

  async stopAllDaemons() {
    console.log('🛑 Stopping all enhanced daemons...');
    
    try {
      // Stop all daemons
      const stopPromises = Array.from(this.daemons.values()).map(daemon => daemon.stop());
      await Promise.all(stopPromises);
      
      this.daemons.clear();
      this.isRunning = false;
      
      console.log('✅ All enhanced daemons stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping enhanced daemons:', error.message);
      throw error;
    }
  }

  // ==================== ENHANCED DAEMON STATUS ====================

  getDaemonStatus(daemonId) {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) {
      return { running: false, error: 'Daemon not found' };
    }
    
    return daemon.getStatus();
  }

  getAllDaemonStatus() {
    const status = {
      managerRunning: this.isRunning,
      daemons: {}
    };
    
    for (const [id, daemon] of this.daemons) {
      status.daemons[id] = daemon.getStatus();
    }
    
    return status;
  }

  // ==================== ENHANCED DAEMON CONTROL ====================

  async forceKeyRotation() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.forceKeyRotation();
  }

  async resetKeyRotation() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.reset();
  }

  // ==================== HASH VALIDATION CONTROL ====================

  async enableHashValidation() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.enableHashValidation();
  }

  async disableHashValidation() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.disableHashValidation();
  }

  async forceHashValidation() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.forceHashValidation();
  }

  async forcePasswordChange() {
    const daemon = this.daemons.get('enhancedKeyRotation');
    if (!daemon) {
      throw new Error('Enhanced key rotation daemon is not running');
    }
    
    await daemon.forcePasswordChange();
  }

  // ==================== GRACEFUL SHUTDOWN ====================

  async gracefulShutdown() {
    console.log('🔄 Graceful shutdown initiated...');
    
    try {
      await this.stopAllDaemons();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error.message);
      process.exit(1);
    }
  }

  // ==================== PROCESS HANDLERS ====================

  setupProcessHandlers() {
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });
  }
}

module.exports = EnhancedDaemonManager;
