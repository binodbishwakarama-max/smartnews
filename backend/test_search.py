import requests

# Test search endpoint
r = requests.get('http://127.0.0.1:8000/api/v1/articles/search?q=climate')
print(f"Search for 'climate': Status {r.status_code}")

if r.status_code == 200:
    data = r.json()
    print(f"Found {data.get('total', 0)} results")
    print()
    for art in data.get('results', [])[:5]:
        print(f"- {art['title']}")
        print(f"  Category: {art['category']} | Source: {art['source']}")
        print()
else:
    print(f"Error: {r.text}")
