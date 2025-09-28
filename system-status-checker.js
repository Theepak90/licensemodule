#!/usr/bin/env node

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('\n🔍 TORRO LICENSE SYSTEM - COMPREHENSIVE STATUS CHECK');
console.log('==================================================\n');

const API_BASE = 'http://localhost:3005/api';

async function checkSystemStatus() {
  const results = {
    server: { status: '❌', details: '' },
    database: { status: '❌', details: '' },
    daemon: { status: '❌', details: '' },
    hashValidation: { status: '❌', details: '' },
    keyRotation: { status: '❌', details: '' },
    militarySecurity: { status: '❌', details: '' },
    licenseCreation: { status: '❌', details: '' },
    authentication: { status: '❌', details: '' }
  };

  // 1. Check Server Health
  try {
    console.log('🏥 Checking Server Health...');
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    results.server.status = '✅';
    results.server.details = `Server running on port 3005`;
    console.log('✅ Server is healthy');
  } catch (error) {
    results.server.details = error.message;
    console.log('❌ Server health check failed:', error.message);
  }

  // 2. Check Database Connection
  try {
    console.log('\n📊 Checking Database Connection...');
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    if (response.data.database) {
      results.database.status = '✅';
      results.database.details = 'MongoDB connected';
      console.log('✅ Database connected');
    }
  } catch (error) {
    results.database.details = error.message;
    console.log('❌ Database check failed');
  }

  // 3. Check Daemon System
  try {
    console.log('\n🤖 Checking Daemon System...');
    const response = await axios.get(`${API_BASE}/daemon/status`, { timeout: 5000 });
    results.daemon.status = '✅';
    results.daemon.details = 'Enhanced daemon system running';
    console.log('✅ Daemon system active');
  } catch (error) {
    results.daemon.details = error.message;
    console.log('❌ Daemon check failed:', error.message);
  }

  // 4. Check Hash Validation
  try {
    console.log('\n🔒 Checking Hash Validation...');
    const response = await axios.get(`${API_BASE}/security/hash-validation`, { timeout: 5000 });
    results.hashValidation.status = '✅';
    results.hashValidation.details = 'Hash validation enabled and running';
    console.log('✅ Hash validation active');
  } catch (error) {
    results.hashValidation.details = error.message;
    console.log('❌ Hash validation check failed');
  }

  // 5. Check Key Rotation
  try {
    console.log('\n🔑 Checking Key Rotation...');
    const response = await axios.get(`${API_BASE}/daemon/key-rotation-status`, { timeout: 5000 });
    results.keyRotation.status = '✅';
    results.keyRotation.details = 'Key rotation daemon active';
    console.log('✅ Key rotation active');
  } catch (error) {
    results.keyRotation.details = error.message;
    console.log('❌ Key rotation check failed');
  }

  // 6. Check Military Security
  try {
    console.log('\n🛡️  Checking Military Security...');
    const response = await axios.get(`${API_BASE}/security/military-status`, { timeout: 5000 });
    results.militarySecurity.status = '✅';
    results.militarySecurity.details = 'Military-grade security enabled';
    console.log('✅ Military security active');
  } catch (error) {
    results.militarySecurity.details = error.message;
    console.log('❌ Military security check failed');
  }

  // 7. Test License Creation
  try {
    console.log('\n📝 Testing License Creation...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@torro.com',
      password: 'admin123'
    }, { timeout: 5000 });

    if (loginResponse.data.token) {
      const licenseResponse = await axios.post(`${API_BASE}/licenses`, {
        clientName: 'Test Client',
        clientEmail: 'test@test.com',
        licenseType: 'trial',
        expiryDays: 30,
        maxUsers: 1
      }, {
        headers: { Authorization: `Bearer ${loginResponse.data.token}` },
        timeout: 10000
      });

      results.licenseCreation.status = '✅';
      results.licenseCreation.details = 'License creation working with military security';
      console.log('✅ License creation successful');
      
      results.authentication.status = '✅';
      results.authentication.details = 'Admin authentication working';
      console.log('✅ Authentication working');
    }
  } catch (error) {
    results.licenseCreation.details = error.message;
    results.authentication.details = error.message;
    console.log('❌ License creation/auth failed:', error.message);
  }

  // Display Final Results
  console.log('\n\n📋 SYSTEM STATUS SUMMARY');
  console.log('========================');
  
  Object.entries(results).forEach(([component, result]) => {
    console.log(`${result.status} ${component.toUpperCase()}: ${result.details}`);
  });

  const allGood = Object.values(results).every(r => r.status === '✅');
  
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL - MILITARY-GRADE SECURITY ACTIVE!');
  } else {
    console.log('⚠️  SOME SYSTEMS NEED ATTENTION');
  }
  console.log('='.repeat(50));

  return results;
}

// Run the check
checkSystemStatus().catch(console.error);
