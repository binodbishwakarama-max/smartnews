import requests
from bs4 import BeautifulSoup
session = requests.Session()
session.headers.update({'User-Agent': 'Mozilla/5.0'})
url = "https://www.nationalgeographic.com/environment"
try:
    r = session.get(url, timeout=10)
    print(f"Status: {r.status_code}")
    soup = BeautifulSoup(r.text, 'html.parser')
    links = [a['href'] for a in soup.find_all('a', href=True) if '/article/' in a['href']]
    print(f"Found {len(links)} article links")
except Exception as e:
    print(f"Error: {e}")
