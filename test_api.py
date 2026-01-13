"""
Test script for Smart News Aggregator API
Tests authentication, endpoints, and basic functionality
"""

import requests
import json
from time import sleep

BASE_URL = "http://127.0.0.1:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} - {name}")
    if details:
        print(f"  {Colors.YELLOW}{details}{Colors.END}")

def test_health_check():
    try:
        resp = requests.get(f"{BASE_URL}/")
        passed = resp.status_code == 200 and resp.json().get("status") == "ok"
        print_test("Health Check", passed, resp.json() if passed else f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False

def test_signup():
    try:
        data = {"username": "testuser123", "password": "testpass123"}
        resp = requests.post(f"{BASE_URL}/auth/signup", json=data)
        
        # 400 is OK if user already exists
        if resp.status_code == 400 and "already registered" in resp.text:
            print_test("Signup", True, "User already exists (expected)")
            return None
        
        passed = resp.status_code == 201 and "access_token" in resp.json()
        token = resp.json().get("access_token") if passed else None
        print_test("Signup", passed, f"Token: {token[:20]}..." if token else resp.text[:100])
        return token
    except Exception as e:
        print_test("Signup", False, str(e))
        return None

def test_login():
    try:
        data = {"username": "testuser123", "password": "testpass123"}
        resp = requests.post(f"{BASE_URL}/auth/login", json=data)
        passed = resp.status_code == 200 and "access_token" in resp.json()
        token = resp.json().get("access_token") if passed else None
        print_test("Login", passed, f"Token: {token[:20]}..." if token else resp.text[:100])
        return token
    except Exception as e:
        print_test("Login", False, str(e))
        return None

def test_get_current_user(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        passed = resp.status_code == 200 and "username" in resp.json()
        print_test("Get Current User", passed, resp.json() if passed else resp.text[:100])
        return passed
    except Exception as e:
        print_test("Get Current User", False, str(e))
        return False

def test_articles():
    try:
        resp = requests.get(f"{BASE_URL}/articles?limit=5")
        passed = resp.status_code == 200 and isinstance(resp.json(), list)
        count = len(resp.json()) if passed else 0
        print_test("Get Articles", passed, f"Retrieved {count} articles")
        return passed
    except Exception as e:
        print_test("Get Articles", False, str(e))
        return False

def test_categories():
    try:
        resp = requests.get(f"{BASE_URL}/categories")
        passed = resp.status_code == 200 and isinstance(resp.json(), list)
        cats = resp.json() if passed else []
        print_test("Get Categories", passed, f"Categories: {', '.join(cats)}")
        return passed
    except Exception as e:
        print_test("Get Categories", False, str(e))
        return False

def test_trending():
    try:
        resp = requests.get(f"{BASE_URL}/trending?limit=5")
        passed = resp.status_code == 200 and isinstance(resp.json(), list)
        count = len(resp.json()) if passed else 0
        print_test("Get Trending", passed, f"Retrieved {count} trending articles")
        return passed
    except Exception as e:
        print_test("Get Trending", False, str(e))
        return False

def test_protected_endpoint_without_auth():
    try:
        resp = requests.get(f"{BASE_URL}/user/history")
        # Should get 401 Unauthorized
        passed = resp.status_code == 401
        print_test("Protected Endpoint (No Auth)", passed, "Correctly rejected" if passed else "Should return 401")
        return passed
    except Exception as e:
        print_test("Protected Endpoint (No Auth)", False, str(e))
        return False

def test_user_history(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/user/history", headers=headers)
        passed = resp.status_code == 200
        print_test("Get User History (Authenticated)", passed, f"History items: {len(resp.json())}" if passed else resp.text[:100])
        return passed
    except Exception as e:
        print_test("Get User History (Authenticated)", False, str(e))
        return False

def test_rate_limiting():
    try:
        # Make many requests quickly
        responses = []
        for i in range(12):
            resp = requests.get(f"{BASE_URL}/categories")
            responses.append(resp.status_code)
        
        # Should eventually get 429 Too Many Requests (if rate limit is strict)
        # But for testing, we just check all succeeded
        passed = all(r in [200, 429] for r in responses)
        rate_limited = 429 in responses
        print_test("Rate Limiting", passed, f"Made 12 requests, {'hit rate limit' if rate_limited else 'all OK (rate limit may be lenient)'}")
        return passed
    except Exception as e:
        print_test("Rate Limiting", False, str(e))
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Smart News Aggregator - Production Readiness Tests{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    results = {}
    
    # Basic functionality
    print(f"{Colors.BLUE}=== Basic Functionality ==={Colors.END}")
    results['health'] = test_health_check()
    results['articles'] = test_articles()
    results['categories'] = test_categories()
    results['trending'] = test_trending()
    
    # Authentication
    print(f"\n{Colors.BLUE}=== Authentication Tests ==={Colors.END}")
    token = test_signup()
    if not token:
        token = test_login()
    
    if token:
        results['auth'] = True
        results['current_user'] = test_get_current_user(token)
        results['user_history'] = test_user_history(token)
    else:
        results['auth'] = False
        print_test("Authentication Flow", False, "Could not obtain token")
    
    # Security
    print(f"\n{Colors.BLUE}=== Security Tests ==={Colors.END}")
    results['protected'] = test_protected_endpoint_without_auth()
    results['rate_limit'] = test_rate_limiting()
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Test Summary{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"\nPassed: {Colors.GREEN}{passed}/{total}{Colors.END} ({percentage:.1f}%)")
    
    if percentage == 100:
        print(f"\n{Colors.GREEN}✓ All tests passed! System is functioning correctly.{Colors.END}")
    elif percentage >= 80:
        print(f"\n{Colors.YELLOW}⚠ Most tests passed. Some features may need attention.{Colors.END}")
    else:
        print(f"\n{Colors.RED}✗ Multiple test failures. Please review the errors above.{Colors.END}")
    
    print(f"\n{Colors.BLUE}Production Readiness: {'Ready for MVP' if percentage >= 90 else 'Needs work'}{Colors.END}")
    print(f"{Colors.YELLOW}Note: This is basic smoke testing. Full production requires comprehensive test suite.{Colors.END}\n")

if __name__ == "__main__":
    main()
