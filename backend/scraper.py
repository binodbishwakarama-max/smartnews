import requests
from bs4 import BeautifulSoup
from newspaper import Article as NewsArticle
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)

SOURCES = [
    'https://www.bbc.com',
    'https://www.cnn.com',
    'https://timesofindia.indiatimes.com',
    'https://www.theverge.com',
    'https://news.ycombinator.com'
]

def fetch_article(url, timeout=10):
    """Fetch and parse article from URL"""
    try:
        art = NewsArticle(url)
        art.download()
        art.parse()
        
        # Validate we got actual content
        if not art.title or len(art.text) < 100:
            logger.debug(f'Insufficient content from {url}')
            return None
            
        return {
            'title': art.title,
            'content': art.text,
            'image': art.top_image,
            'author': ', '.join(art.authors) if art.authors else None,
            'publish_date': art.publish_date or datetime.utcnow(),
            'url': url
        }
    except Exception as e:
        logger.debug(f'Failed to fetch {url}: {e}')
        return None

def scrape_bbc():
    urls = []
    r = requests.get('https://www.bbc.com/news')
    soup = BeautifulSoup(r.text, 'html.parser')
    for a in soup.select('a')[:50]:  # Broaden selector and increase limit
        href = a.get('href')
        if href and href.startswith('/') and '/news/' in href:
            urls.append('https://www.bbc.com' + href)
    return list(set(urls))

def scrape_cnn():
    urls = []
    r = requests.get('https://edition.cnn.com')
    soup = BeautifulSoup(r.text, 'html.parser')
    for a in soup.select('a')[:80]: # Check more links
        href = a.get('href')
        if href and href.startswith('/') and '/202' in href: # Simple date check for articles
             urls.append('https://edition.cnn.com' + href)
    return list(set(urls))[:50]

def scrape_theverge():
    urls = []
    r = requests.get('https://www.theverge.com')
    soup = BeautifulSoup(r.text, 'html.parser')
    for a in soup.select('a')[:80]:
        href = a.get('href')
        if href and href.startswith('/') and len(href) > 20: # Rough length check for article slugs
            urls.append('https://www.theverge.com' + href)
    return list(set(urls))[:50]

def scrape_timesofindia():
    urls = []
    r = requests.get('https://timesofindia.indiatimes.com')
    soup = BeautifulSoup(r.text, 'html.parser')
    for a in soup.select('a')[:100]:
        href = a.get('href')
        if href and 'articleshow' in href:
            if href.startswith('/'):
                urls.append('https://timesofindia.indiatimes.com' + href)
            else:
                urls.append(href)
    return list(set(urls))[:50]

def scrape_hackernews():
    # Use HN API to get top stories
    urls = []
    try:
        r = requests.get('https://hacker-news.firebaseio.com/v0/topstories.json')
        ids = r.json()[:50]
        for id in ids:
            rr = requests.get(f'https://hacker-news.firebaseio.com/v0/item/{id}.json')
            data = rr.json()
            if data and data.get('url'):
                urls.append(data['url'])
    except Exception:
        pass
    return urls

def scrape_all():
    urls = []
    try:
        urls += scrape_bbc()
    except Exception:
        logger.exception('bbc')
    try:
        urls += scrape_cnn()
    except Exception:
        logger.exception('cnn')
    try:
        urls += scrape_timesofindia()
    except Exception:
        logger.exception('toi')
    try:
        urls += scrape_theverge()
    except Exception:
        logger.exception('verge')
    try:
        urls += scrape_hackernews()
    except Exception:
        logger.exception('hn')

    # Deduplicate URLs
    seen = set()
    articles = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        art = fetch_article(url)
        if art:
            art['source'] = url.split('/')[2]
            articles.append(art)
        time.sleep(0.1)
    return articles
