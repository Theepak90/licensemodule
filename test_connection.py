#!/usr/bin/env python3
"""
Test script to verify frontend-backend connection
"""

import requests
import json

def test_backend_connection():
    """Test backend connectivity"""
    try:
        # Test health endpoint
        response = requests.get('http://localhost:3010/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend Health: OK")
            return True
        else:
            print(f"❌ Backend Health: Failed ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Backend Connection: {e}")
        return False

def test_frontend_connection():
    """Test frontend connectivity"""
    try:
        response = requests.get('http://localhost:3009', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: OK")
            return True
        else:
            print(f"❌ Frontend: Failed ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Frontend Connection: {e}")
        return False

def test_authentication():
    """Test authentication flow"""
    try:
        # Test login
        login_data = {
            'email': 'admin@torro.com',
            'password': 'admin123'
        }
        
        response = requests.post(
            'http://localhost:3010/api/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print("✅ Authentication: OK")
            
            # Test protected endpoint
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(
                'http://localhost:3010/api/licenses',
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Protected Endpoint: OK ({data.get('total', 0)} licenses)")
                return True
            else:
                print(f"❌ Protected Endpoint: Failed ({response.status_code})")
                return False
        else:
            print(f"❌ Authentication: Failed ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Authentication Test: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    try:
        # Test preflight request
        response = requests.options(
            'http://localhost:3010/api/auth/login',
            headers={
                'Origin': 'http://localhost:3009',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout=5
        )
        
        if response.status_code == 200:
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            if cors_origin == 'http://localhost:3009':
                print("✅ CORS: OK")
                return True
            else:
                print(f"❌ CORS: Wrong origin ({cors_origin})")
                return False
        else:
            print(f"❌ CORS: Failed ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ CORS Test: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Frontend-Backend Connection")
    print("=" * 50)
    
    tests = [
        ("Backend Connection", test_backend_connection),
        ("Frontend Connection", test_frontend_connection),
        ("CORS Configuration", test_cors),
        ("Authentication Flow", test_authentication)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your system is working correctly!")
        print("\n🌐 Access your application:")
        print("   Frontend: http://localhost:3009")
        print("   Backend:  http://localhost:3010/api")
        print("\n🔑 Login credentials:")
        print("   Email:    admin@torro.com")
        print("   Password: admin123")
    else:
        print("❌ Some tests failed. Check the errors above.")

if __name__ == '__main__':
    main()
