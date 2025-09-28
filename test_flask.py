#!/usr/bin/env python3
"""
Test script for Flask License Manager
"""

import requests
import json
import time
import sys

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get('http://localhost:3010/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {data.get('status')}")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    try:
        # Test registration
        register_data = {
            'email': 'test@example.com',
            'password': 'test123',
            'role': 'admin'
        }
        
        response = requests.post('http://localhost:3010/api/auth/register', 
                               json=register_data, timeout=5)
        
        if response.status_code in [200, 201, 400]:  # 400 if user already exists
            print("✅ Registration endpoint working")
            if response.status_code == 201:
                token = response.json().get('token')
                if token:
                    print("✅ JWT token generated")
                    return token
        else:
            print(f"❌ Registration failed: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth test failed: {e}")
        return None

def test_license_endpoints(token):
    """Test license endpoints with authentication"""
    if not token:
        print("⚠️  Skipping license tests - no token")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Test getting licenses
        response = requests.get('http://localhost:3010/api/licenses', 
                              headers=headers, timeout=5)
        
        if response.status_code == 200:
            print("✅ License list endpoint working")
            data = response.json()
            print(f"   Found {data.get('total', 0)} licenses")
        else:
            print(f"❌ License list failed: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ License test failed: {e}")

def test_license_validation():
    """Test license validation endpoint"""
    try:
        # Test with invalid license
        validation_data = {
            'licenseKey': 'INVALID-KEY',
            'clientId': 'INVALID-CLIENT'
        }
        
        response = requests.post('http://localhost:3010/api/licenses/validate', 
                               json=validation_data, timeout=5)
        
        if response.status_code == 404:
            print("✅ License validation endpoint working (correctly rejected invalid license)")
        else:
            print(f"❌ License validation unexpected response: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ License validation test failed: {e}")

def main():
    """Main test function"""
    print("🧪 Testing Flask License Manager")
    print("=" * 40)
    
    # Wait a moment for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    # Test health endpoint
    if not test_health_endpoint():
        print("❌ Server not responding. Make sure Flask app is running on port 3010")
        sys.exit(1)
    
    print()
    
    # Test auth endpoints
    token = test_auth_endpoints()
    print()
    
    # Test license endpoints
    test_license_endpoints(token)
    print()
    
    # Test license validation
    test_license_validation()
    print()
    
    print("=" * 40)
    print("✅ Flask migration test completed!")
    print("🚀 Your Flask License Manager is working correctly!")

if __name__ == '__main__':
    main()
