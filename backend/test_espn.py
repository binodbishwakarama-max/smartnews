import logging
import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
})

def test_espn():
    url = "https://www.espn.com/nfl/"
    r = session.get(url, timeout=15)
    soup = BeautifulSoup(r.text, 'html.parser')
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/'):
            href = f"https://www.espn.com{href}"
        
        if len(href) > 25 and any(ext in href for ext in ['/202', '/news/', '/article/', 'articleshow', '/story/', '/sport/', '/national/']):
            links.append(href)
    
    print(f"Found {len(links)} links")
    for l in links[:5]:
        print(l)

if __name__ == "__main__":
    test_espn()
