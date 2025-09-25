const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');

class DaemonIntegration extends EventEmitter {
  constructor() {
    super();
    this.keyStoragePath = process.env.KEY_STORAGE_PATH || path.join(__dirname, '..', 'keys');
    this.currentKey = null;
    this.keyWatcher = null;
  }

  // ==================== KEY INTEGRATION ====================

  async initialize() {
    console.log('🔗 Initializing daemon integration...');
    
    // Load current key
    await this.loadCurrentKey();
    
    // Start watching for key changes
    this.startKeyWatcher();
    
    console.log('✅ Daemon integration initialized');
  }

  async loadCurrentKey() {
    try {
      const currentKeyPath = path.join(this.keyStoragePath, 'current.json');
      
      if (fs.existsSync(currentKeyPath)) {
        const keyData = JSON.parse(fs.readFileSync(currentKeyPath, 'utf8'));
        this.currentKey = keyData.key;
        console.log(`🔑 Loaded current key (index: ${keyData.index})`);
        return keyData;
      } else {
        console.log('⚠️  No current key found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading current key:', error.message);
      return null;
    }
  }

  startKeyWatcher() {
    const currentKeyPath = path.join(this.keyStoragePath, 'current.json');
    
    if (fs.existsSync(currentKeyPath)) {
      // Watch for changes to the current key file
      this.keyWatcher = fs.watchFile(currentKeyPath, async (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          console.log('🔄 Key file changed, reloading...');
          await this.loadCurrentKey();
          this.emit('keyChanged', this.currentKey);
        }
      });
      
      console.log('👀 Started watching key file for changes');
    }
  }

  stopKeyWatcher() {
    if (this.keyWatcher) {
      const currentKeyPath = path.join(this.keyStoragePath, 'current.json');
      fs.unwatchFile(currentKeyPath);
      this.keyWatcher = null;
      console.log('👀 Stopped watching key file');
    }
  }

  // ==================== KEY RETRIEVAL ====================

  getCurrentKey() {
    return this.currentKey;
  }

  async getKeyByIndex(index) {
    try {
      const keyPath = path.join(this.keyStoragePath, 'history', `key-${index}.json`);
      
      if (fs.existsSync(keyPath)) {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        return keyData;
      }
    } catch (error) {
      console.error(`❌ Error loading key ${index}:`, error.message);
    }
    
    return null;
  }

  async getKeyHistory() {
    try {
      const historyPath = path.join(this.keyStoragePath, 'history.json');
      
      if (fs.existsSync(historyPath)) {
        const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        return historyData;
      }
    } catch (error) {
      console.error('❌ Error loading key history:', error.message);
    }
    
    return null;
  }

  // ==================== KEY VALIDATION ====================

  async validateKey(key) {
    if (!key) {
      return false;
    }

    try {
      // Check if key exists in current or history
      const currentKeyData = await this.loadCurrentKey();
      if (currentKeyData && currentKeyData.key === key) {
        return true;
      }

      // Check history
      const history = await this.getKeyHistory();
      if (history && history.keys) {
        return history.keys.some(k => k.key === key);
      }

      return false;
    } catch (error) {
      console.error('❌ Error validating key:', error.message);
      return false;
    }
  }

  // ==================== KEY STATISTICS ====================

  async getKeyStats() {
    try {
      const history = await this.getKeyHistory();
      const currentKeyData = await this.loadCurrentKey();
      
      return {
        currentKey: this.currentKey ? this.currentKey.substring(0, 8) + '...' : null,
        currentIndex: currentKeyData ? currentKeyData.index : 0,
        totalKeys: history ? history.totalKeys : 0,
        historySize: history ? history.keys.length : 0,
        lastUpdated: history ? history.lastUpdated : null
      };
    } catch (error) {
      console.error('❌ Error getting key stats:', error.message);
      return null;
    }
  }

  // ==================== CLEANUP ====================

  async cleanup() {
    console.log('🧹 Cleaning up daemon integration...');
    
    this.stopKeyWatcher();
    this.currentKey = null;
    
    console.log('✅ Daemon integration cleaned up');
  }
}

module.exports = DaemonIntegration;
