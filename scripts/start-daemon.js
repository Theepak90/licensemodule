#!/usr/bin/env node

const DaemonManager = require('../services/daemons/daemonManager');
require('dotenv').config();

async function startDaemon() {
  console.log('🔑 TORRO KEY ROTATION DAEMON');
  console.log('============================');
  
  const daemonManager = new DaemonManager();
  
  // Set up process handlers
  daemonManager.setupProcessHandlers();
  
  try {
    // Start all daemons
    await daemonManager.startAllDaemons();
    
    // Keep the process alive
    console.log('🔄 Daemon is running... Press Ctrl+C to stop');
    
    // Status reporting every 5 minutes
    setInterval(() => {
      const status = daemonManager.getAllDaemonStatus();
      console.log(`📊 Status: ${status.daemons.keyRotation ? 'Running' : 'Stopped'}, Keys: ${status.daemons.keyRotation?.keyIndex || 0}`);
    }, 300000); // 5 minutes
    
  } catch (error) {
    console.error('❌ Failed to start daemon:', error.message);
    process.exit(1);
  }
}

// Start the daemon
startDaemon().catch(console.error);
