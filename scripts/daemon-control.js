#!/usr/bin/env node

const DaemonManager = require('../services/daemons/daemonManager');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DaemonControl {
  constructor() {
    this.daemonManager = new DaemonManager();
    this.pidFile = path.join(__dirname, '..', 'daemon.pid');
  }

  async start() {
    console.log('🚀 Starting Torro Key Rotation Daemon...');
    
    try {
      await this.daemonManager.startAllDaemons();
      
      // Write PID file
      fs.writeFileSync(this.pidFile, process.pid.toString());
      console.log(`✅ Daemon started with PID: ${process.pid}`);
      console.log('📁 PID file:', this.pidFile);
      
      // Keep running
      this.daemonManager.setupProcessHandlers();
      
    } catch (error) {
      console.error('❌ Failed to start daemon:', error.message);
      process.exit(1);
    }
  }

  async stop() {
    console.log('🛑 Stopping Torro Key Rotation Daemon...');
    
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
      console.error('❌ Error stopping daemon:', error.message);
    }
  }

  async status() {
    console.log('📊 Torro Key Rotation Daemon Status');
    console.log('====================================');
    
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
    console.log('🔄 Resetting daemon...');
    
    try {
      await this.daemonManager.resetKeyRotation();
      console.log('✅ Daemon reset completed');
    } catch (error) {
      console.error('❌ Error resetting daemon:', error.message);
    }
  }

  showHelp() {
    console.log('🔑 Torro Key Rotation Daemon Control');
    console.log('=====================================');
    console.log('');
    console.log('Usage: node scripts/daemon-control.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  start     Start the daemon');
    console.log('  stop      Stop the daemon');
    console.log('  status    Show daemon status');
    console.log('  rotate    Force key rotation');
    console.log('  reset     Reset daemon state');
    console.log('  help      Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/daemon-control.js start');
    console.log('  node scripts/daemon-control.js status');
    console.log('  node scripts/daemon-control.js rotate');
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const control = new DaemonControl();
  
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
