#!/usr/bin/env python3
"""
Test script to verify the backend is working correctly
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_home():
    """Test home endpoint (should return HTML)"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Home endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Content-Type: {response.headers.get('content-type')}")
            if 'text/html' in response.headers.get('content-type', ''):
                print("   ✓ Returns HTML")
            else:
                print("   ⚠️  Returns non-HTML content")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Home endpoint failed: {e}")
        return False

def test_registration_stats():
    """Test public registration stats endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/registrations/public")
        print(f"✅ Registration stats: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Total registrations: {data.get('total_registrations', 0)}")
            print(f"   ABU students: {data.get('abu_students', 0)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Registration stats failed: {e}")
        return False

def test_registration():
    """Test registration endpoint with test data"""
    try:
        # Test data - will fail payment verification but tests the endpoint
        data = {
            "name": "Test User",
            "email": "test@example.com",
            "abu_student": "yes",
            "paystack_ref": "test_reference",  # This should pass in test mode
            "interest": "Testing the backend"
        }
        
        # Create form data
        files = {}
        
        response = requests.post(f"{BASE_URL}/register", data=data, files=files)
        print(f"✅ Registration endpoint: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Success: {result.get('success')}")
            print(f"   Message: {result.get('message')}")
        elif response.status_code == 400:
            result = response.json()
            print(f"   Error: {result.get('message')}")
        return response.status_code in [200, 400]
    except Exception as e:
        print(f"❌ Registration endpoint failed: {e}")
        return False

def test_admin_endpoint():
    """Test admin endpoint (should fail without proper header)"""
    try:
        response = requests.get(f"{BASE_URL}/admin/registrations")
        print(f"✅ Admin endpoint (no auth): {response.status_code}")
        if response.status_code == 403:
            print("   ✓ Correctly requires authentication")
        return response.status_code == 403
    except Exception as e:
        print(f"❌ Admin endpoint failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Lex Xperience Backend Test")
    print("=" * 60)
    print()
    
    tests = [
        ("Health Check", test_health),
        ("Home Endpoint", test_home),
        ("Registration Stats", test_registration_stats),
        ("Registration Endpoint", test_registration),
        ("Admin Endpoint", test_admin_endpoint),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n--- Testing: {name} ---")
        result = test_func()
        results.append((name, result))
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
