import requests
import json

base_url = "http://127.0.0.1:8000/news"

def check_endpoint(path):
    try:
        r = requests.get(f"{base_url}{path}")
        print(f"--- Testing {path} ---")
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                print(f"Items returned: {len(data)}")
                if len(data) > 0:
                    print(f"First item title: {data[0].get('title', 'N/A')}")
            else:
                print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    check_endpoint("/stats")
    check_endpoint("/quick-feed")
    check_endpoint("/environment")
    check_endpoint("/ai-startups")
