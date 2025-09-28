#!/bin/bash

echo "🚀 Starting Torro License Manager with MILITARY-GRADE SECURITY"
echo "🔒 All licenses will use military-grade security + daemon"
echo ""

# Copy military config
echo "📋 Copying military-grade configuration..."
cp military-config.env .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Start the server
echo "🚀 Starting server on port 3005..."
echo "🌐 Frontend will run on port 3004"
echo "🔗 API will be available at http://localhost:3005/api"
echo ""

# Start both server and client
npm run dev
