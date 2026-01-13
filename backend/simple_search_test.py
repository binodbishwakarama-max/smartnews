import requests

print("Testing Search API...")
print()

# Test search
r = requests.get('http://127.0.0.1:8000/api/v1/articles/search?q=climate')
print(f"Status: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    print(f"Found {data['total']} results")
    print()
    print("Top 3 results:")
    for i, art in enumerate(data['results'][:3], 1):
        print(f"{i}. {art['title']}")
        print(f"   {art['category']} - {art['source']}")
        print()
    print("Search API is working!")
else:
    print(f"Error: {r.status_code}")
