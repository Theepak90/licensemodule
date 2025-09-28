#!/usr/bin/env node

const EnhancedDaemonManager = require('../services/daemons/enhancedDaemonManager');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EnhancedDaemonControl {
  constructor() {
    this.daemonManager = new EnhancedDaemonManager();
    this.pidFile = path.join(__dirname, '..', 'enhanced-daemon.pid');
  }

  async start() {
    console.log('🚀 Starting Torro Enhanced Key Rotation Daemon...');
    
    try {
      await this.daemonManager.startAllDaemons();
      
      // Write PID file
      fs.writeFileSync(this.pidFile, process.pid.toString());
      console.log(`✅ Enhanced daemon started with PID: ${process.pid}`);
      console.log('📁 PID file:', this.pidFile);
      
      // Keep running
      this.daemonManager.setupProcessHandlers();
      
    } catch (error) {
      console.error('❌ Failed to start enhanced daemon:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('🛑 Stopping Torro Enhanced Key Rotation Daemon...');
    
    try {
      // Read PID from file
      if (fs.existsSync(this.pidFile)) {
        const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
        console.log(`📁 Found PID file: ${pid}`);
        
        // Try to kill the process
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          console.log(`✅ Sent SIGTERM to process ${pid}`);
        } catch (error) {
          if (error.code === 'ESRCH') {
            console.log('⚠️  Process not found, removing PID file');
          } else {
            console.error('❌ Error killing process:', error.message);
          }
        }
        
        // Remove PID file
        fs.unlinkSync(this.pidFile);
        console.log('✅ PID file removed');
      } else {
        console.log('⚠️  No PID file found');
      }
      
    } catch (error) {
      console.error('❌ Error stopping enhanced daemon:', error.message);
    }
  }

  async status() {
    console.log('📊 Torro Enhanced Key Rotation Daemon Status');
    console.log('=============================================');
    
    try {
      const status = this.daemonManager.getAllDaemonStatus();
      
      console.log(`Manager Running: ${status.managerRunning ? '✅ Yes' : '❌ No'}`);
      console.log(`Active Daemons: ${Object.keys(status.daemons).length}`);
      
      for (const [name, daemonStatus] of Object.entries(status.daemons)) {
        console.log(`\n${name}:`);
        console.log(`  Running: ${daemonStatus.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`  Current Key: ${daemonStatus.currentKey || 'None'}`);
        console.log(`  Key Index: ${daemonStatus.keyIndex}`);
        console.log(`  History Size: ${daemonStatus.historySize}`);
        console.log(`  Next Rotation: ${daemonStatus.nextRotation ? new Date(daemonStatus.nextRotation).toISOString() : 'N/A'}`);
        
        // Hash validation status
        if (daemonStatus.hashValidation) {
          console.log(`  Hash Validation:`);
          console.log(`    Enabled: ${daemonStatus.hashValidation.enabled ? '✅ Yes' : '❌ No'}`);
          console.log(`    Running: ${daemonStatus.hashValidation.running ? '✅ Yes' : '❌ No'}`);
          console.log(`    Current Hash: ${daemonStatus.hashValidation.currentHash || 'None'}`);
          console.log(`    Mismatch Count: ${daemonStatus.hashValidation.mismatchCount}`);
          console.log(`    Last Validation: ${daemonStatus.hashValidation.lastValidation ? 
            new Date(daemonStatus.hashValidation.lastValidation.timestamp).toISOString() : 'N/A'}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting status:', error.message);
    }
  }

  async forceRotation() {
    console.log('🔄 Forcing key rotation...');
    
    try {
      await this.daemonManager.forceKeyRotation();
      console.log('✅ Key rotation completed');
    } catch (error) {
      console.error('❌ Error forcing rotation:', error.message);
    }
  }

  async reset() {
    console.log('🔄 Resetting enhanced daemon...');
    
    try {
      await this.daemonManager.resetKeyRotation();
      console.log('✅ Enhanced daemon reset completed');
    } catch (error) {
      console.error('❌ Error resetting enhanced daemon:', error.message);
    }
  }

  async enableHashValidation() {
    console.log('🔐 Enabling hash validation...');
    
    try {
      await this.daemonManager.enableHashValidation();
      console.log('✅ Hash validation enabled');
    } catch (error) {
      console.error('❌ Error enabling hash validation:', error.message);
    }
  }

  async disableHashValidation() {
    console.log('🔐 Disabling hash validation...');
    
    try {
      await this.daemonManager.disableHashValidation();
      console.log('✅ Hash validation disabled');
    } catch (error) {
      console.error('❌ Error disabling hash validation:', error.message);
    }
  }

  async forceHashValidation() {
    console.log('🔍 Forcing hash validation...');
    
    try {
      await this.daemonManager.forceHashValidation();
      console.log('✅ Hash validation completed');
    } catch (error) {
      console.error('❌ Error forcing hash validation:', error.message);
    }
  }

  async forcePasswordChange() {
    console.log('🔑 Forcing password change...');
    
    try {
      await this.daemonManager.forcePasswordChange();
      console.log('✅ Password change completed');
    } catch (error) {
      console.error('❌ Error forcing password change:', error.message);
    }
  }

  showHelp() {
    console.log('�� Torro Enhanced Key Rotation Daemon Control');
    console.log('==============================================');
    console.log('');
    console.log('Usage: node scripts/enhanced-daemon-control.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  start              Start the enhanced daemon');
    console.log('  stop               Stop the enhanced daemon');
    console.log('  status             Show daemon status');
    console.log('  rotate             Force key rotation');
    console.log('  reset              Reset daemon state');
    console.log('  enable-hash        Enable hash validation');
    console.log('  disable-hash       Disable hash validation');
    console.log('  validate-hash      Force hash validation');
    console.log('  change-password    Force password change');
    console.log('  help               Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/enhanced-daemon-control.js start');
    console.log('  node scripts/enhanced-daemon-control.js status');
    console.log('  node scripts/enhanced-daemon-control.js enable-hash');
    console.log('  node scripts/enhanced-daemon-control.js validate-hash');
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const control = new EnhancedDaemonControl();
  
  switch (command) {
    case 'start':
      await control.start();
      break;
    case 'stop':
      await control.stop();
      break;
    case 'status':
      await control.status();
      break;
    case 'rotate':
      await control.forceRotation();
      break;
    case 'reset':
      await control.reset();
      break;
    case 'enable-hash':
      await control.enableHashValidation();
      break;
    case 'disable-hash':
      await control.disableHashValidation();
      break;
    case 'validate-hash':
      await control.forceHashValidation();
      break;
    case 'change-password':
      await control.forcePasswordChange();
      break;
    case 'help':
    case '--help':
    case '-h':
      control.showHelp();
      break;
    default:
      console.error('❌ Unknown command:', command);
      control.showHelp();
      process.exit(1);
  }
}

main().catch(console.error);
