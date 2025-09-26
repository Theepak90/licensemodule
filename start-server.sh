#!/bin/bash

# Torro License Management System - Server Startup Script
# This script ensures all required environment variables are set before starting the server

echo "🚀 Starting Torro License Management System..."

# Set required environment variables
export JWT_SECRET="torro-super-secret-jwt-key-2024-change-in-production"
export NODE_ENV="development"
export PORT="3005"
export MONGODB_URI="mongodb://localhost:27017/torro_licenses"
export CORS_ORIGIN="http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:3004"

# Additional security variables
export MILITARY_SECURITY_ENABLED="true"
export HARDWARE_BINDING_REQUIRED="true"
export ANTI_TAMPERING_ENABLED="true"
export SELF_DESTRUCTION_ENABLED="true"
export SECURITY_LEVEL="military"

# Key rotation and hash validation
export KEY_ROTATION_INTERVAL="3600000"
export ENABLE_HASH_VALIDATION="true"
export HASH_VALIDATION_ALGORITHM="sha256"
export HASH_VALIDATION_SALT="torro-hash-salt-2024"

# Rate limiting
export RATE_LIMIT_WINDOW_MS="3600000"
export RATE_LIMIT_MAX_REQUESTS="100"

echo "✅ Environment variables loaded"
echo "🔑 JWT_SECRET: Set"
echo "🌍 NODE_ENV: $NODE_ENV"
echo "🔌 PORT: $PORT"
echo "🗄️  MONGODB_URI: $MONGODB_URI"
echo "🔒 Security features: Enabled"

# Start the server
echo "🚀 Starting server..."
node server.js
