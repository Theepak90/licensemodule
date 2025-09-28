#!/bin/bash

# Torro License Manager - Flask Startup Script

echo "🚀 Starting Torro License Manager (Flask)"
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Set up environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment configuration..."
    cp flask.env.example .env
    echo "✅ Environment file created. You may want to edit .env with your settings."
fi

# Run migration
echo "🔄 Running migration..."
python migrate_to_flask.py

# Start the Flask application
echo "🚀 Starting Flask application..."
echo "=========================================="
echo "📊 Frontend Dashboard: http://localhost:3009"
echo "🔗 API Endpoint: http://localhost:3010/api"
echo "🌍 Environment: development"
echo "=========================================="

python run_flask.py
