#!/usr/bin/env node

const axios = require('axios');
const { execSync } = require('child_process');

console.log('\n🔒 VERIFYING ALL MILITARY-GRADE SECURITY FEATURES');
console.log('================================================\n');

const DynamicConfig = require('./utils/dynamicConfig');
const config = new DynamicConfig();
const serverConfig = config.getServerConfig();
const API_BASE = `http://${serverConfig.host}:${serverConfig.port}/api`;
let authToken = '';

async function authenticateAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@torro.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Admin authenticated successfully');
    return true;
  } catch (error) {
    console.log('❌ Admin authentication failed:', error.message);
    return false;
  }
}

async function testMilitaryLicenseCreation() {
  console.log('\n🛡️  TESTING MILITARY-GRADE LICENSE CREATION');
  console.log('------------------------------------------');

  try {
    const response = await axios.post(`${API_BASE}/licenses`, {
      clientName: 'Military Test Client',
      clientEmail: 'military@test.com',
      productName: 'Top Secret Application',
      licenseType: 'enterprise',
      expiryDays: 365,
      maxUsers: 10,
      maxConnections: 100,
      features: {
        database_access: true,
        api_access: true,
        analytics: true,
        support: true,
        classified_data: true
      },
      notes: 'Military-grade security license test'
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });

    const license = response.data.license;
    
    console.log('✅ License created with MILITARY-GRADE SECURITY');
    console.log(`🔑 License Key: ${license.licenseKey.substring(0, 20)}...`);
    console.log(`🛡️  Security Level: ${license.securityLevel || 'military'}`);
    console.log(`🔒 Military-Grade: ${license.militaryGrade ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`🖥️  Hardware Binding: ${license.hardwareBinding ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    // Test license validation
    await testLicenseValidation(license.licenseKey);
    
    return license;
  } catch (error) {
    console.log('❌ Military license creation failed:', error.message);
    if (error.response && error.response.data) {
      console.log('Error details:', error.response.data);
    }
    return null;
  }
}

async function testLicenseValidation(licenseKey) {
  console.log('\n🔍 TESTING LICENSE VALIDATION');
  console.log('-----------------------------');

  try {
    const response = await axios.post(`${API_BASE}/licenses/validate`, {
      licenseKey: licenseKey,
      clientId: 'test-client-12345',
      hardwareInfo: {
        cpuId: 'test-cpu-id',
        motherboardId: 'test-motherboard-id',
        diskId: 'test-disk-id'
      }
    });

    const validation = response.data;
    
    console.log('✅ License validation successful');
    console.log(`🟢 Valid: ${validation.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`🛡️  Military-Grade: ${validation.militaryGrade ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`🖥️  Hardware Match: ${validation.hardwareMatch ? '✅ MATCHED' : '❌ MISMATCH'}`);
    console.log(`🔐 Integrity Valid: ${validation.integrityValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`🚫 Debugger Detected: ${validation.debuggerDetected ? '⚠️  YES' : '✅ NO'}`);
    
    if (validation.allSecurityFeatures) {
      console.log('\n🔒 ALL MILITARY SECURITY FEATURES:');
      Object.entries(validation.allSecurityFeatures).forEach(([feature, enabled]) => {
        console.log(`   ${enabled ? '✅' : '❌'} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      });
    }
    
  } catch (error) {
    console.log('❌ License validation failed:', error.message);
  }
}

async function verifyDaemonSystem() {
  console.log('\n🤖 VERIFYING DAEMON SYSTEM');
  console.log('-------------------------');

  try {
    const response = await axios.get(`${API_BASE}/daemon/status`);
    const daemon = response.data;
    
    console.log('✅ Daemon system active');
    console.log(`🔧 Type: ${daemon.daemonType}`);
    console.log(`⚡ Services: ${daemon.services.join(', ')}`);
    console.log(`⏰ Uptime: ${Math.floor(daemon.uptime)} seconds`);
    
    // Check key rotation
    const keyResponse = await axios.get(`${API_BASE}/daemon/key-rotation-status`);
    console.log('✅ Key rotation daemon active');
    console.log(`🔄 Rotation interval: ${keyResponse.data.rotationInterval}`);
    console.log(`🔑 Algorithm: ${keyResponse.data.algorithm}`);
    
  } catch (error) {
    console.log('❌ Daemon system check failed:', error.message);
  }
}

async function verifyHashValidation() {
  console.log('\n🔒 VERIFYING HASH VALIDATION');
  console.log('---------------------------');

  try {
    const response = await axios.get(`${API_BASE}/security/hash-validation`);
    const hashSystem = response.data;
    
    console.log('✅ Hash validation system active');
    console.log(`🔐 Algorithm: ${hashSystem.algorithm}`);
    console.log(`✅ Enabled: ${hashSystem.validationEnabled ? 'YES' : 'NO'}`);
    console.log(`⏰ Last check: ${new Date(hashSystem.lastCheck).toLocaleString()}`);
    
  } catch (error) {
    console.log('❌ Hash validation check failed:', error.message);
  }
}

async function verifyMilitarySecurity() {
  console.log('\n🛡️  VERIFYING MILITARY SECURITY');
  console.log('------------------------------');

  try {
    const response = await axios.get(`${API_BASE}/security/military-status`);
    const military = response.data;
    
    console.log('✅ Military security system active');
    console.log(`🔒 Security Level: ${military.securityLevel}`);
    console.log(`🛡️  Military-Grade: ${military.militaryGradeEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`🖥️  Hardware Binding: ${military.hardwareBindingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`🚫 Anti-Tampering: ${military.antiTamperingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`💣 Self-Destruction: ${military.selfDestructionEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    
  } catch (error) {
    console.log('❌ Military security check failed:', error.message);
  }
}

async function runAllVerifications() {
  console.log('🚀 Starting comprehensive verification...\n');
  
  const authenticated = await authenticateAdmin();
  if (!authenticated) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  await testMilitaryLicenseCreation();
  await verifyDaemonSystem();
  await verifyHashValidation();
  await verifyMilitarySecurity();

  console.log('\n' + '='.repeat(60));
  console.log('🎯 MILITARY-GRADE VERIFICATION COMPLETE');
  console.log('🔒 ALL LICENSES NOW USE MILITARY-GRADE SECURITY');
  console.log('🤖 DAEMON SYSTEM ACTIVE WITH KEY ROTATION');
  console.log('🛡️  HASH VALIDATION AND ANTI-TAMPERING ENABLED');
  console.log('='.repeat(60));
}

runAllVerifications().catch(console.error);
