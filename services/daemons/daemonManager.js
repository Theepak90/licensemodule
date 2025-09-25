const KeyRotationDaemon = require('./keyRotationDaemon');
const path = require('path');

class DaemonManager {
  constructor() {
    this.daemons = new Map();
    this.isRunning = false;
  }

  // ==================== DAEMON MANAGEMENT ====================

  async startKeyRotationDaemon(options = {}) {
    const daemonId = 'keyRotation';
    
    if (this.daemons.has(daemonId)) {
      console.log('Key rotation daemon is already running');
      return this.daemons.get(daemonId);
    }

    const daemon = new KeyRotationDaemon(options);
    
    // Set up event listeners
    daemon.on('started', () => {
      console.log('🔑 Key rotation daemon started');
    });
    
    daemon.on('stopped', () => {
      console.log('🔑 Key rotation daemon stopped');
    });
    
    daemon.on('keyRotated', (data) => {
      console.log(`🔑 Key rotated: index ${data.index}, timestamp ${new Date(data.timestamp).toISOString()}`);
    });
    
    daemon.on('error', (error) => {
      console.error('🔑 Key rotation daemon error:', error.message);
    });

    await daemon.start();
    this.daemons.set(daemonId, daemon);
    
    return daemon;
  }

  async stopKeyRotationDaemon() {
    const daemonId = 'keyRotation';
    const daemon = this.daemons.get(daemonId);
    
    if (!daemon) {
      console.log('Key rotation daemon is not running');
      return;
    }

    await daemon.stop();
    this.daemons.delete(daemonId);
  }

  async startAllDaemons() {
    console.log('🚀 Starting all daemons...');
    
    try {
      // Start key rotation daemon
      await this.startKeyRotationDaemon();
      
      this.isRunning = true;
      console.log('✅ All daemons started successfully');
      
    } catch (error) {
      console.error('❌ Error starting daemons:', error.message);
      throw error;
    }
  }

  async stopAllDaemons() {
    console.log('🛑 Stopping all daemons...');
    
    try {
      // Stop all daemons
      const stopPromises = Array.from(this.daemons.values()).map(daemon => daemon.stop());
      await Promise.all(stopPromises);
      
      this.daemons.clear();
      this.isRunning = false;
      
      console.log('✅ All daemons stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping daemons:', error.message);
      throw error;
    }
  }

  // ==================== DAEMON STATUS ====================

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

  // ==================== DAEMON CONTROL ====================

  async forceKeyRotation() {
    const daemon = this.daemons.get('keyRotation');
    if (!daemon) {
      throw new Error('Key rotation daemon is not running');
    }
    
    await daemon.forceKeyRotation();
  }

  async resetKeyRotation() {
    const daemon = this.daemons.get('keyRotation');
    if (!daemon) {
      throw new Error('Key rotation daemon is not running');
    }
    
    await daemon.reset();
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

module.exports = DaemonManager;
