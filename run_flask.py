#!/usr/bin/env python3
"""
Flask License Manager Startup Script
"""

import os
import sys
from app import app, db

def create_tables():
    """Create database tables"""
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully")

def main():
    """Main startup function"""
    print("🚀 Starting Torro License Manager (Flask)")
    print("=" * 50)
    
    # Create tables
    create_tables()
    
    # Get configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 3010))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"📊 Frontend Dashboard: http://localhost:3009")
    print(f"🔗 API Endpoint: http://{host}:{port}/api")
    print(f"🌍 Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"🔧 Debug Mode: {debug}")
    print("=" * 50)
    
    # Start the Flask application
    app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    main()
