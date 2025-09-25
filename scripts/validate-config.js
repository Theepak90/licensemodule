#!/usr/bin/env node

const ConfigValidator = require('../utils/configValidator');
require('dotenv').config();

const validator = new ConfigValidator();
const validation = validator.validate();

validator.printValidationReport(validation);

if (!validation.valid) {
  console.log('\n🚀 Generating secure configuration...');
  const secureConfig = validator.generateSecureConfig();
  console.log('\n📝 Add these to your .env file:');
  Object.entries(secureConfig).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\n📋 Recommended configuration:');
  const recommended = validator.getRecommendedConfig();
  Object.entries(recommended).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  process.exit(1);
} else {
  console.log('\n🎉 Configuration validation passed! Starting server...');
  process.exit(0);
}
