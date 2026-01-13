import requests
try:
    r = requests.get('http://127.0.0.1:8000/api/v1/articles?category=Sports')
    data = r.json()
    print(f"API Returned {len(data)} articles for category 'Sports'")
    for a in data[:10]:
        print(f"Title: {a['title']} | Source: {a['source']}")
except Exception as e:
    print(f"Error: {e}")
