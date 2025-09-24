#!/usr/bin/env node

/**
 * Torro License Manager Setup Script
 * This script helps set up the initial environment and creates the first admin user
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/torro_licenses', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    const email = await question('Enter admin email (default: admin@torro.com): ') || 'admin@torro.com';
    const password = await question('Enter admin password (default: admin123): ') || 'admin123';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  Admin user already exists with this email');
      return existingUser;
    }

    // Create admin user
    const user = new User({
      email,
      password,
      role: 'admin'
    });

    await user.save();
    console.log('✅ Admin user created successfully');
    return user;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  }
}

async function validateEnvironment() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'LICENSE_ENCRYPTION_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.log('⚠️  Missing required environment variables:');
    missing.forEach(envVar => {
      console.log(`   - ${envVar}`);
    });
    console.log('\nPlease update your .env file with these variables.');
    return false;
  }

  console.log('✅ Environment variables validated');
  return true;
}

async function generateEnvFile() {
  const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/torro_licenses
DB_NAME=torro_licenses

# JWT Configuration
JWT_SECRET=${require('crypto').randomBytes(64).toString('hex')}
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# License Configuration
LICENSE_ENCRYPTION_KEY=${require('crypto').randomBytes(32).toString('hex')}
LICENSE_CHECK_INTERVAL=60000

# Security
ADMIN_EMAIL=admin@torro.com
ADMIN_PASSWORD=admin123
`;

  const fs = require('fs');
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created with secure random keys');
  } else {
    console.log('⚠️  .env file already exists, skipping creation');
  }
}

async function main() {
  console.log('🚀 Torro License Manager Setup');
  console.log('================================\n');

  try {
    // Generate .env file if it doesn't exist
    await generateEnvFile();

    // Validate environment
    if (!await validateEnvironment()) {
      console.log('\n❌ Setup incomplete. Please fix the environment variables and run again.');
      process.exit(1);
    }

    // Setup database
    await setupDatabase();

    // Create admin user
    await createAdminUser();

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Access the dashboard: http://localhost:3000');
    console.log('3. Login with your admin credentials');
    console.log('\nHappy licensing! 🎯');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupDatabase, createAdminUser, validateEnvironment };

