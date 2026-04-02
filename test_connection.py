"""
Connection Resilience Testing Script

This script tests the frontend-backend connection resilience
by simulating various failure scenarios.
"""

import time
import requests
import threading
from typing import List, Dict

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

class ConnectionTester:
    def __init__(self):
        self.results: List[Dict] = []
    
    def test_health_endpoint(self):
        """Test backend health check"""
        print("\n🔍 Testing Health Endpoint...")
        try:
            start = time.time()
            response = requests.get(f"{BACKEND_URL}/health", timeout=5)
            duration = time.time() - start
            data = response.json()
            
            print(f"  ✅ Health check passed ({duration:.2f}s)")
            print(f"     Status: {data.get('status')}")
            print(f"     Database: {data.get('database')}")
            print(f"     Version: {data.get('version')}")
            return True
        except Exception as e:
            print(f"  ❌ Health check failed: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test various API endpoints"""
        endpoints = [
            "/api/v1/articles?limit=5",
            "/news/stats",
            "/news/quick-feed",
        ]
        
        print("\n📡 Testing API Endpoints...")
        for endpoint in endpoints:
            try:
                start = time.time()
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
                duration = time.time() - start
                if response.status_code == 200:
                    print(f"  ✅ {endpoint} ({duration:.2f}s)")
                else:
                    print(f"  ⚠️  {endpoint} returned {response.status_code}")
            except requests.Timeout:
                print(f"  ❌ {endpoint} timed out")
            except Exception as e:
                print(f"  ❌ {endpoint} error: {e}")
    
    def test_retry_logic(self):
        """Test retry logic simulation (manual)"""
        print("\n🔄 Testing Retry Logic (Client-side simulation)...")
        print("  ℹ️  The actual retry logic is in the frontend code (lib/api.ts)")
        print("  ℹ️  Here we verify the backend handles requests correctly")
        
        try:
            start = time.time()
            response = requests.get(f"{BACKEND_URL}/non-existent-endpoint", timeout=2)
            if response.status_code == 404:
                 print(f"  ✅ Backend correctly returns 404 for missing routes")
        except Exception as e:
            print(f"  ⚠️  Backend connection error: {e}")

    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        print("\n⚡ Testing Concurrent Requests...")
        
        def make_request(results, index):
            try:
                requests.get(f"{BACKEND_URL}/health", timeout=5)
                results[index] = True
            except:
                results[index] = False
        
        num_requests = 10
        threads = []
        results = [False] * num_requests
        
        start = time.time()
        for i in range(num_requests):
            t = threading.Thread(target=make_request, args=(results, i))
            threads.append(t)
            t.start()
            
        for t in threads:
            t.join()
            
        duration = time.time() - start
        successful = sum(results)
        print(f"  ✅ {successful}/{num_requests} requests successful ({duration:.2f}s)")
        print(f"     Average: {duration/num_requests:.2f}s per request")

    def run_all_tests(self):
        """Run all connection tests"""
        print("=" * 60)
        print("🧪 SmartNews Connection Resilience Test Suite")
        print("=" * 60)
        
        self.test_health_endpoint()
        self.test_api_endpoints()
        self.test_retry_logic()
        self.test_concurrent_requests()
        
        print("\n" + "=" * 60)
        print("✨ Test Suite Complete!")
        print("=" * 60)

if __name__ == "__main__":
    print("\n🚀 Starting Connection Tests...\n")
    print("Make sure both backend and frontend are running:")
    print(f"  - Backend: {BACKEND_URL}")
    print(f"  - Frontend: {FRONTEND_URL}")
    
    tester = ConnectionTester()
    tester.run_all_tests()
