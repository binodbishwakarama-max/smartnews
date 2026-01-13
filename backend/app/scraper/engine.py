import logging
import requests
from bs4 import BeautifulSoup
from newspaper import Article as NewsArticle
from datetime import datetime
from app.scraper.config import SourceConfig, SOURCES

logger = logging.getLogger(__name__)

class ContentEngine:
    """
    Advanced scraping engine that handles:
    - Homepage crawling
    - Article parsing
    - Metadata extraction
    """
    
    def fetch_article_content(self, url: str):
        """Deep fetch of a single article"""
        try:
            art = NewsArticle(url)
            art.download()
            art.parse()
            
            if not art.title or len(art.text) < 200:
                return None
                
            return {
                'title': art.title,
                'content': art.text,
                'summary': art.summary, # Newspaper3k nlp() needs to be called for this, but we'll use raw text for ML
                'image': art.top_image,
                'author': ', '.join(art.authors) if art.authors else None,
                'publish_date': art.publish_date or datetime.utcnow(),
                'url': url
            }
        except Exception as e:
            logger.error(f"Failed to parse {url}: {e}")
            return None

    def discover_links(self, source: SourceConfig):
        """
        Intelligent link discovery on a homepage/section page.
        Filters for links that look like articles.
        """
        urls = set()
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            r = requests.get(source.url, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # Heuristic: Find all links
            for a in soup.find_all('a', href=True):
                href = a['href']
                
                # Normalize URL
                if href.startswith('/'):
                    full_url = source.url.rstrip('/') + href if not source.url.endswith(href) else source.url + href # Simple join is risky, keep it basic
                    # Better:
                    from urllib.parse import urljoin
                    full_url = urljoin(source.url, href)
                else:
                    full_url = href
                    
                # Filter Logic
                # 1. Must same domain (mostly)
                if source.name.lower().replace(' ', '') not in full_url.lower() and 'http' in full_url:
                     # Check if it's the same base domain
                     pass 

                # 2. Must look like an article 
                # (long path, has date, or distinct slug)
                if len(full_url.split('/')) > 3 and '-' in full_url:
                    urls.add(full_url)
                    
        except Exception as e:
            logger.error(f"Discovery failed for {source.name}: {e}")
            
        return list(urls)[:20] # Limit to 20 per scrape to be polite

engine = ContentEngine()
