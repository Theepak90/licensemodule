#!/usr/bin/env python3
"""
Test script to verify all button functionality
"""

import requests
import json

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

def test_create_license(token):
    """Test create license functionality"""
    try:
        license_data = {
            'clientName': 'Button Test Client',
            'clientEmail': 'buttontest@example.com',
            'licenseType': 'premium',
            'expiryDays': 90,
            'maxUsers': 5,
            'maxConnections': 50
        }
        
        response = requests.post(
            'http://localhost:3010/api/licenses',
            json=license_data,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Create License Button: OK")
            return data['license']['id']
        else:
            print(f"❌ Create License Button: Failed ({response.status_code})")
            return None
    except Exception as e:
        print(f"❌ Create License Button: {e}")
        return None

def test_view_license(token, license_id):
    """Test view license functionality"""
    try:
        response = requests.get(
            f'http://localhost:3010/api/licenses/{license_id}',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ View License Button: OK")
            return data
        else:
            print(f"❌ View License Button: Failed ({response.status_code})")
            return None
    except Exception as e:
        print(f"❌ View License Button: {e}")
        return None

def test_edit_license(token, license_id):
    """Test edit license functionality"""
    try:
        update_data = {
            'clientName': 'Updated Button Test Client',
            'maxUsers': 10
        }
        
        response = requests.put(
            f'http://localhost:3010/api/licenses/{license_id}',
            json=update_data,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Edit License Button: OK")
            return data
        else:
            print(f"❌ Edit License Button: Failed ({response.status_code})")
            return None
    except Exception as e:
        print(f"❌ Edit License Button: {e}")
        return None

def test_delete_license(token, license_id):
    """Test delete license functionality"""
    try:
        response = requests.delete(
            f'http://localhost:3010/api/licenses/{license_id}',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Delete License Button: OK")
            return True
        else:
            print(f"❌ Delete License Button: Failed ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Delete License Button: {e}")
        return False

def test_license_validation():
    """Test license validation functionality"""
    try:
        validation_data = {
            'licenseKey': 'TORRO-MIL-1234567890-ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890-12345678',
            'clientId': 'TORRO-1234567890-ABCD-EFGHIJKLM-12345678'
        }
        
        response = requests.post(
            'http://localhost:3010/api/licenses/validate',
            json=validation_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ License Validation: OK")
            return True
        else:
            print(f"❌ License Validation: Failed ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ License Validation: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing All Button Functionality")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    print("✅ Authentication: OK")
    print()
    
    # Test create license
    license_id = test_create_license(token)
    if not license_id:
        print("❌ Cannot proceed without creating a license")
        return
    
    print()
    
    # Test view license
    license_data = test_view_license(token, license_id)
    if not license_data:
        print("❌ Cannot proceed without viewing license")
        return
    
    print()
    
    # Test edit license
    edit_result = test_edit_license(token, license_id)
    if not edit_result:
        print("❌ Edit functionality failed")
        return
    
    print()
    
    # Test license validation
    validation_result = test_license_validation()
    
    print()
    
    # Test delete license
    delete_result = test_delete_license(token, license_id)
    
    print()
    print("=" * 50)
    print("📊 Button Functionality Test Results:")
    print("✅ Create License: Working")
    print("✅ View License: Working")
    print("✅ Edit License: Working")
    print(f"{'✅' if validation_result else '❌'} License Validation: {'Working' if validation_result else 'Failed'}")
    print(f"{'✅' if delete_result else '❌'} Delete License: {'Working' if delete_result else 'Failed'}")
    
    if all([license_id, license_data, edit_result, validation_result, delete_result]):
        print("\n🎉 ALL BUTTONS ARE WORKING CORRECTLY!")
        print("🌐 Your Flask License Manager is fully functional!")
    else:
        print("\n⚠️  Some buttons may have issues. Check the errors above.")

if __name__ == '__main__':
    main()
