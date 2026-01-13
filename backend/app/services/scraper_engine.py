import logging
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from newspaper import Article as NewspaperArticle

logger = logging.getLogger(__name__)

class BaseScraper:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def fetch(self, url: str):
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def parse_article(self, url: str):
        """Standardized parsing using newspaper3k as fallback or primary"""
        try:
            article = NewspaperArticle(url)
            article.download()
            article.parse()
            return {
                "title": article.title,
                "content": article.text,
                "summary": "",  # To be filled by AI
                "url": url,
                "image_url": article.top_image,
                "publish_date": article.publish_date or datetime.utcnow(),
                "author": ", ".join(article.authors),
            }
        except Exception as e:
            logger.error(f"Error parsing article {url}: {e}")
            return None

class BBCScraper(BaseScraper):
    def scrape_feed(self):
        html = self.fetch("https://www.bbc.com/news")
        if not html: return []
        
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a in soup.select('a'):
            href = a.get('href')
            if href and href.startswith('/news/') and href.count('/') > 2:
                links.add(f"https://www.bbc.com{href}")
        return list(links)[:30] # Increased limit for more variety

class CNNScraper(BaseScraper):
    def scrape_feed(self):
        html = self.fetch("https://edition.cnn.com")
        if not html: return []
        
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a in soup.select('a'):
            href = a.get('href')
            if href and href.startswith('/') and '/202' in href:
                links.add(f"https://edition.cnn.com{href}")
        return list(links)[:30]

class VergeScraper(BaseScraper):
    def scrape_feed(self):
        html = self.fetch("https://www.theverge.com")
        if not html: return []
        
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a in soup.select('a'):
            href = a.get('href')
            if href and href.startswith('/') and len(href) > 25:
                links.add(f"https://www.theverge.com{href}")
        return list(links)[:30]

class TOIScraper(BaseScraper):
    def scrape_feed(self):
        html = self.fetch("https://timesofindia.indiatimes.com")
        if not html: return []
        
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a in soup.select('a'):
            href = a.get('href')
            if href and 'articleshow' in href:
                if href.startswith('/'):
                    links.add(f"https://timesofindia.indiatimes.com{href}")
                else:
                    links.add(href)
        return list(links)[:30]

class HNScraper(BaseScraper):
    def scrape_feed(self):
        try:
            r = requests.get('https://hacker-news.firebaseio.com/v0/topstories.json', timeout=10)
            ids = r.json()[:30]
            links = []
            for id in ids:
                rr = requests.get(f'https://hacker-news.firebaseio.com/v0/item/{id}.json', timeout=10)
                data = rr.json()
                if data and data.get('url'):
                    links.append(data['url'])
            return links
        except Exception as e:
            logger.error(f"HN Scraper failed: {e}")
            return []

# Factory
def get_scrapers():
    return [
        BBCScraper("https://www.bbc.com"), 
        CNNScraper("https://edition.cnn.com"),
        VergeScraper("https://www.theverge.com"),
        TOIScraper("https://timesofindia.indiatimes.com"),
        HNScraper("https://news.ycombinator.com")
    ]
