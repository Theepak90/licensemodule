#!/usr/bin/env python3
"""
Test script to verify license extension functionality
"""

import requests
import json
from datetime import datetime, timedelta

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            'http://localhost:3010/api/auth/login',
            json={'email': 'admin@torro.com', 'password': 'admin123'},
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        if response.status_code == 200:
            return response.json()['token']
        return None
    except Exception as e:
        print(f"❌ Auth failed: {e}")
        return None

def test_license_extension(token):
    """Test license extension functionality"""
    try:
        # First, get a license to extend
        response = requests.get(
            'http://localhost:3010/api/licenses',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get licenses: {response.status_code}")
            return False
        
        licenses = response.json()['licenses']
        if not licenses:
            print("❌ No licenses found to test extension")
            return False
        
        license_id = licenses[0]['id']
        original_expiry = licenses[0]['expiryDate']
        
        print(f"✅ Found license: {license_id}")
        print(f"   Original expiry: {original_expiry}")
        
        # Calculate new expiry date (30 days from now)
        new_expiry = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
        
        # Update the license with new expiry date
        update_response = requests.put(
            f'http://localhost:3010/api/licenses/{license_id}',
            json={'expiryDate': new_expiry},
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        
        if update_response.status_code == 200:
            data = update_response.json()
            print("✅ License Extension: OK")
            print(f"   New expiry: {data['license']['expiryDate']}")
            return True
        else:
            print(f"❌ License Extension: Failed ({update_response.status_code})")
            print(f"   Response: {update_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ License Extension: {e}")
        return False

def test_features_update(token):
    """Test features update functionality"""
    try:
        # Get a license to update
        response = requests.get(
            'http://localhost:3010/api/licenses',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get licenses: {response.status_code}")
            return False
        
        licenses = response.json()['licenses']
        if not licenses:
            print("❌ No licenses found to test features update")
            return False
        
        license_id = licenses[0]['id']
        
        # Update features
        features = {
            'database_access': True,
            'api_access': True,
            'analytics': True,
            'support': True
        }
        
        update_response = requests.put(
            f'http://localhost:3010/api/licenses/{license_id}',
            json={'features': features},
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        
        if update_response.status_code == 200:
            data = update_response.json()
            print("✅ Features Update: OK")
            print(f"   Features: {data['license']['features']}")
            return True
        else:
            print(f"❌ Features Update: Failed ({update_response.status_code})")
            print(f"   Response: {update_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Features Update: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing License Extension & Features Update")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    print("✅ Authentication: OK")
    print()
    
    # Test license extension
    extension_result = test_license_extension(token)
    print()
    
    # Test features update
    features_result = test_features_update(token)
    
    print()
    print("=" * 50)
    print("📊 Test Results:")
    print(f"{'✅' if extension_result else '❌'} License Extension: {'Working' if extension_result else 'Failed'}")
    print(f"{'✅' if features_result else '❌'} Features Update: {'Working' if features_result else 'Failed'}")
    
    if extension_result and features_result:
        print("\n🎉 ALL EXTENSION FUNCTIONALITY IS WORKING!")
    else:
        print("\n⚠️  Some functionality may have issues. Check the errors above.")

if __name__ == '__main__':
    main()
