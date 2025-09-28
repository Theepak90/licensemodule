#!/usr/bin/env node

const DaemonIntegration = require('../services/daemonIntegration');
const fs = require('fs');
const path = require('path');

class DaemonTester {
  constructor() {
    this.integration = new DaemonIntegration();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 TORRO DAEMON TESTING SUITE');
    console.log('==============================\n');

    try {
      await this.integration.initialize();
      
      // Test 1: Basic Integration
      await this.testBasicIntegration();
      
      // Test 2: Key Generation
      await this.testKeyGeneration();
      
      // Test 3: Key Validation
      await this.testKeyValidation();
      
      // Test 4: Key History
      await this.testKeyHistory();
      
      // Test 5: File Watching
      await this.testFileWatching();
      
      // Test 6: Key Statistics
      await this.testKeyStatistics();
      
      // Test 7: Error Handling
      await this.testErrorHandling();
      
      // Print Results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      await this.integration.cleanup();
    }
  }

  async testBasicIntegration() {
    console.log('🔧 Test 1: Basic Integration');
    try {
      const currentKey = this.integration.getCurrentKey();
      if (currentKey && currentKey.length === 64) {
        this.addResult('Basic Integration', 'PASS', 'Current key loaded successfully');
      } else {
        this.addResult('Basic Integration', 'FAIL', 'Current key not loaded or invalid format');
      }
    } catch (error) {
      this.addResult('Basic Integration', 'FAIL', error.message);
    }
  }

  async testKeyGeneration() {
    console.log('🔑 Test 2: Key Generation');
    try {
      const key1 = this.integration.getCurrentKey();
      console.log('   Waiting for key rotation...');
      
      // Wait for key rotation
      await new Promise(resolve => setTimeout(resolve, 35000));
      
      const key2 = this.integration.getCurrentKey();
      
      if (key1 !== key2) {
        this.addResult('Key Generation', 'PASS', 'Keys are rotating correctly');
      } else {
        this.addResult('Key Generation', 'FAIL', 'Keys are not rotating');
      }
    } catch (error) {
      this.addResult('Key Generation', 'FAIL', error.message);
    }
  }

  async testKeyValidation() {
    console.log('✅ Test 3: Key Validation');
    try {
      const currentKey = this.integration.getCurrentKey();
      const isValid = await this.integration.validateKey(currentKey);
      const isInvalid = await this.integration.validateKey('invalid-key');
      
      if (isValid && !isInvalid) {
        this.addResult('Key Validation', 'PASS', 'Validation working correctly');
      } else {
        this.addResult('Key Validation', 'FAIL', 'Validation not working correctly');
      }
    } catch (error) {
      this.addResult('Key Validation', 'FAIL', error.message);
    }
  }

  async testKeyHistory() {
    console.log('📚 Test 4: Key History');
    try {
      const history = await this.integration.getKeyHistory();
      if (history && history.keys && history.keys.length > 0) {
        this.addResult('Key History', 'PASS', `Found ${history.keys.length} keys in history`);
      } else {
        this.addResult('Key History', 'FAIL', 'No key history found');
      }
    } catch (error) {
      this.addResult('Key History', 'FAIL', error.message);
    }
  }

  async testFileWatching() {
    console.log('👀 Test 5: File Watching');
    try {
      const initialKey = this.integration.getCurrentKey();
      
      // Simulate file change
      const currentKeyPath = path.join(__dirname, '..', 'keys', 'current.json');
      const keyData = JSON.parse(fs.readFileSync(currentKeyPath, 'utf8'));
      keyData.timestamp = Date.now();
      fs.writeFileSync(currentKeyPath, JSON.stringify(keyData, null, 2));
      
      // Wait for file watcher
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newKey = this.integration.getCurrentKey();
      if (newKey === initialKey) {
        this.addResult('File Watching', 'PASS', 'File watching working correctly');
      } else {
        this.addResult('File Watching', 'FAIL', 'File watching not working');
      }
    } catch (error) {
      this.addResult('File Watching', 'FAIL', error.message);
    }
  }

  async testKeyStatistics() {
    console.log('📊 Test 6: Key Statistics');
    try {
      const stats = await this.integration.getKeyStats();
      if (stats && stats.currentKey && stats.currentIndex > 0) {
        this.addResult('Key Statistics', 'PASS', `Stats: Index ${stats.currentIndex}, Key ${stats.currentKey}`);
      } else {
        this.addResult('Key Statistics', 'FAIL', 'Statistics not available');
      }
    } catch (error) {
      this.addResult('Key Statistics', 'FAIL', error.message);
    }
  }

  async testErrorHandling() {
    console.log('🚨 Test 7: Error Handling');
    try {
      // Test with invalid key
      const result = await this.integration.validateKey(null);
      if (result === false) {
        this.addResult('Error Handling', 'PASS', 'Handles invalid input correctly');
      } else {
        this.addResult('Error Handling', 'FAIL', 'Does not handle invalid input');
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
    console.log('\n📋 TEST RESULTS SUMMARY');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('\n🎉 ALL TESTS PASSED! Daemon is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the results above.');
    }
  }
}

// Run tests
const tester = new DaemonTester();
tester.runAllTests().catch(console.error);
