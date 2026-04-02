
import requests
import json

def check_api():
    base_url = "http://127.0.0.1:8000/news"
    
    # Check stats
    try:
        print(f"checking {base_url}/stats ...")
        r = requests.get(f"{base_url}/stats", timeout=5)
        print(f"Stats Status: {r.status_code}")
        if r.status_code == 200:
            print("Stats Response:", json.dumps(r.json(), indent=2))
        else:
            print("Stats Error:", r.text)
    except Exception as e:
        print(f"Stats Request Failed: {e}")

    # Check category
    try:
        print(f"\nchecking {base_url}/technology ...")
        r = requests.get(f"{base_url}/technology?limit=1", timeout=5)
        print(f"Category Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                print("Latest Technology Article:", json.dumps(data[0], indent=2))
            else:
                print("No technology articles returned.")
        else:
            print("Category Error:", r.text)
    except Exception as e:
        print(f"Category Request Failed: {e}")

if __name__ == "__main__":
    check_api()
