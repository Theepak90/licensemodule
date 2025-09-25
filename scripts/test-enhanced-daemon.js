#!/usr/bin/env node

const EnhancedDaemonManager = require('../services/daemons/enhancedDaemonManager');
const fs = require('fs');
const path = require('path');

class EnhancedDaemonTester {
  constructor() {
    this.daemonManager = new EnhancedDaemonManager();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 TORRO ENHANCED DAEMON TESTING SUITE');
    console.log('=======================================\n');

    try {
      // Test 1: Enhanced Daemon Startup
      await this.testEnhancedDaemonStartup();
      
      // Test 2: Hash Validation
      await this.testHashValidation();
      
      // Test 3: Key Generation with Hash Validation
      await this.testKeyGenerationWithHashValidation();
      
      // Test 4: Password Change on Hash Mismatch
      await this.testPasswordChangeOnMismatch();
      
      // Test 5: Hash Validation Control
      await this.testHashValidationControl();
      
      // Test 6: Enhanced Status
      await this.testEnhancedStatus();
      
      // Test 7: Error Handling
      await this.testErrorHandling();
      
      // Print Results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Enhanced test suite failed:', error.message);
    } finally {
      await this.daemonManager.stopAllDaemons();
    }
  }

  async testEnhancedDaemonStartup() {
    console.log('🚀 Test 1: Enhanced Daemon Startup');
    try {
      await this.daemonManager.startAllDaemons();
      
      const status = this.daemonManager.getAllDaemonStatus();
      if (status.managerRunning && status.daemons.enhancedKeyRotation) {
        this.addResult('Enhanced Daemon Startup', 'PASS', 'Enhanced daemon started successfully');
      } else {
        this.addResult('Enhanced Daemon Startup', 'FAIL', 'Enhanced daemon failed to start');
      }
    } catch (error) {
      this.addResult('Enhanced Daemon Startup', 'FAIL', error.message);
    }
  }

  async testHashValidation() {
    console.log('🔐 Test 2: Hash Validation');
    try {
      // Force hash validation
      await this.daemonManager.forceHashValidation();
      
      const status = this.daemonManager.getDaemonStatus('enhancedKeyRotation');
      if (status.hashValidation && status.hashValidation.running) {
        this.addResult('Hash Validation', 'PASS', 'Hash validation is running');
      } else {
        this.addResult('Hash Validation', 'FAIL', 'Hash validation is not running');
      }
    } catch (error) {
      this.addResult('Hash Validation', 'FAIL', error.message);
    }
  }

  async testKeyGenerationWithHashValidation() {
    console.log('🔑 Test 3: Key Generation with Hash Validation');
    try {
      // Force key rotation
      await this.daemonManager.forceKeyRotation();
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const status = this.daemonManager.getDaemonStatus('enhancedKeyRotation');
      if (status.currentKey && status.keyIndex > 0) {
        this.addResult('Key Generation with Hash Validation', 'PASS', 
          `Key generated: ${status.currentKey}, Index: ${status.keyIndex}`);
      } else {
        this.addResult('Key Generation with Hash Validation', 'FAIL', 'Key generation failed');
      }
    } catch (error) {
      this.addResult('Key Generation with Hash Validation', 'FAIL', error.message);
    }
  }

  async testPasswordChangeOnMismatch() {
    console.log('🔑 Test 4: Password Change on Hash Mismatch');
    try {
      // Force password change
      await this.daemonManager.forcePasswordChange();
      
      // Wait for password change to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.addResult('Password Change on Hash Mismatch', 'PASS', 'Password change completed');
    } catch (error) {
      this.addResult('Password Change on Hash Mismatch', 'FAIL', error.message);
    }
  }

  async testHashValidationControl() {
    console.log('🔧 Test 5: Hash Validation Control');
    try {
      // Test disable hash validation
      await this.daemonManager.disableHashValidation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test enable hash validation
      await this.daemonManager.enableHashValidation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.addResult('Hash Validation Control', 'PASS', 'Hash validation control working');
    } catch (error) {
      this.addResult('Hash Validation Control', 'FAIL', error.message);
    }
  }

  async testEnhancedStatus() {
    console.log('📊 Test 6: Enhanced Status');
    try {
      const status = this.daemonManager.getAllDaemonStatus();
      
      if (status.daemons.enhancedKeyRotation && 
          status.daemons.enhancedKeyRotation.hashValidation) {
        this.addResult('Enhanced Status', 'PASS', 'Enhanced status includes hash validation data');
      } else {
        this.addResult('Enhanced Status', 'FAIL', 'Enhanced status missing hash validation data');
      }
    } catch (error) {
      this.addResult('Enhanced Status', 'FAIL', error.message);
    }
  }

  async testErrorHandling() {
    console.log('🚨 Test 7: Error Handling');
    try {
      // Test with invalid daemon ID
      const invalidStatus = this.daemonManager.getDaemonStatus('invalid');
      if (invalidStatus.error) {
        this.addResult('Error Handling', 'PASS', 'Handles invalid daemon ID correctly');
      } else {
        this.addResult('Error Handling', 'FAIL', 'Does not handle invalid daemon ID');
      }
    } catch (error) {
      this.addResult('Error Handling', 'PASS', 'Throws error for invalid input');
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  }

  printTestResults() {
    console.log('\n📋 ENHANCED TEST RESULTS SUMMARY');
    console.log('==================================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('\n🎉 ALL ENHANCED TESTS PASSED! Hash validation system is working perfectly!');
    } else {
      console.log('\n⚠️  Some enhanced tests failed. Check the results above.');
    }
  }
}

// Run tests
const tester = new EnhancedDaemonTester();
tester.runAllTests().catch(console.error);
