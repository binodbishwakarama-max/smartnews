import requests
import json

# Test the Environment API endpoint
r = requests.get('http://127.0.0.1:8000/api/v1/articles?category=Environment&limit=5')
articles = r.json()

print(f"✅ API returned {len(articles)} Environment articles\n")

for i, article in enumerate(articles[:3], 1):
    print(f"Article {i}:")
    print(f"  Title: {article['title'][:60]}...")
    print(f"  Source: {article['source']}")
    
    img_url = article.get('image_url', '')
    if img_url.startswith('data:image'):
        print(f"  Image: 🎨 PLACEHOLDER (category-colored)")
    elif img_url.startswith('http'):
        print(f"  Image: ✅ REAL IMAGE ({img_url[:50]}...)")
    else:
        print(f"  Image: ❌ MISSING")
    print()
