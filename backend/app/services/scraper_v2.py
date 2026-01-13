import logging
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime
from newspaper import Article as NewspaperArticle

logger = logging.getLogger(__name__)

class NewsSource:
    def __init__(self, name: str, base_url: str, feeds: List[str]):
        self.name = name
        self.base_url = base_url
        self.feeds = feeds # List of category URLs or RSS feeds

SCRAPER_CONFIG = [
    # Global Wire Agencies
    {'name': 'Reuters', 'base_url': 'https://www.reuters.com', 'feeds': [
        ('https://www.reuters.com/world/', 'World'),
        ('https://www.reuters.com/business/', 'Business & Finance'),
        ('https://www.reuters.com/technology/', 'Technology'),
        ('https://www.reuters.com/science/', 'Science')
    ]},
    {'name': 'Associated Press', 'base_url': 'https://apnews.com', 'feeds': [
        ('https://apnews.com/hub/politics', 'Politics'),
        ('https://apnews.com/hub/business', 'Business & Finance'),
        ('https://apnews.com/hub/science', 'Science'),
        ('https://apnews.com/hub/health', 'Health')
    ]},
    {'name': 'Bloomberg', 'base_url': 'https://www.bloomberg.com', 'feeds': [
        ('https://www.bloomberg.com/technology', 'Technology'),
        ('https://www.bloomberg.com/markets', 'Business & Finance'),
        ('https://www.bloomberg.com/politics', 'Politics')
    ]},
    
    # AI & Startups Specialized
    {'name': 'VentureBeat AI', 'base_url': 'https://venturebeat.com', 'feeds': [
        ('https://venturebeat.com/category/ai/', 'AI & Startups')
    ]},
    {'name': 'AI News', 'base_url': 'https://www.artificialintelligence-news.com', 'feeds': [
        ('https://www.artificialintelligence-news.com/', 'AI & Startups')
    ]},
    {'name': 'Sifted', 'base_url': 'https://sifted.eu', 'feeds': [
        ('https://sifted.eu/sections/artificial-intelligence/', 'AI & Startups'),
        ('https://sifted.eu/sections/startups/', 'AI & Startups')
    ]},

    # Science & Deep Tech
    {'name': 'Nature', 'base_url': 'https://www.nature.com', 'feeds': [
        ('https://www.nature.com/nature/articles?type=news', 'Science')
    ]},
    {'name': 'New Scientist', 'base_url': 'https://www.newscientist.com', 'feeds': [
        ('https://www.newscientist.com/section/news/', 'Science'),
        ('https://www.newscientist.com/subject/environment/', 'Environment')
    ]},

    # Education
    {'name': 'EdSurge', 'base_url': 'https://www.edsurge.com', 'feeds': [
        ('https://www.edsurge.com/news', 'Education')
    ]},
    {'name': 'Inside Higher Ed', 'base_url': 'https://www.insidehighered.com', 'feeds': [
        ('https://www.insidehighered.com/news', 'Education')
    ]},
    
    # Environment (Heavy Content)
    {'name': 'The Guardian Environment', 'base_url': 'https://www.theguardian.com', 'feeds': [
        ('https://www.theguardian.com/environment', 'Environment')
    ]},
    {'name': 'Grist', 'base_url': 'https://grist.org', 'feeds': [
        ('https://grist.org/news/', 'Environment')
    ]},
    {'name': 'Mongabay', 'base_url': 'https://news.mongabay.com', 'feeds': [
        ('https://news.mongabay.com/', 'Environment')
    ]},
    {'name': 'National Geographic', 'base_url': 'https://www.nationalgeographic.com', 'feeds': [
        ('https://www.nationalgeographic.com/environment', 'Environment')
    ]},
    
    # India
    {'name': 'The Hindu', 'base_url': 'https://www.thehindu.com', 'feeds': [
        ('https://www.thehindu.com/news/national/', 'World'),
        ('https://www.thehindu.com/sci-tech/technology/', 'Technology'),
        ('https://www.thehindu.com/sport/', 'Sports')
    ]},
    
    # Sports (Powerhouses)
    {'name': 'ESPN', 'base_url': 'https://www.espn.com', 'feeds': [
        ('https://www.espn.com/', 'Sports'),
        ('https://www.espn.com/nfl/', 'Sports'),
        ('https://www.espn.com/nba/', 'Sports')
    ]},
    {'name': 'BBC Sport', 'base_url': 'https://www.bbc.com/sport', 'feeds': [
        ('https://www.bbc.com/sport', 'Sports'),
        ('https://www.bbc.com/sport/football', 'Sports'),
        ('https://www.bbc.com/sport/cricket', 'Sports')
    ]}
]

class ScraperV2:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def get_links(self, feed_url: str) -> List[str]:
        try:
            logger.info(f"Scraping feed: {feed_url}")
            r = self.session.get(feed_url, timeout=15)
            soup = BeautifulSoup(r.text, 'html.parser')
            links = []
            
            # Smart link extraction: avoid nav, footer, ads
            for a in soup.find_all('a', href=True):
                href = a['href']
                # Clean and absolute URL
                if href.startswith('/'):
                    domain = feed_url.split('/')[2]
                    href = f"https://{domain}{href}"
                
                # Heuristics for news articles: long slugs, no query params, contains keywords
                if len(href) > 25 and any(ext in href for ext in ['/202', '/news/', '/article/', 'articleshow', '/story/', '/sport/', '/national/']):
                    links.append(href)
            
            return list(set(links))[:20] # Limit per feed to avoid overwhelming
        except Exception as e:
            logger.error(f"Failed to scrape feed {feed_url}: {e}")
            return []

    def parse_article(self, url: str) -> Dict:
        try:
            article = NewspaperArticle(url)
            article.download()
            article.parse()
            
            if len(article.text) < 200:
                return None
                
            return {
                'title': article.title,
                'content': article.text,
                'author': ", ".join(article.authors),
                'publish_date': article.publish_date or datetime.utcnow(),
                'image_url': article.top_image,
                'url': url
            }
        except Exception as e:
            logger.debug(f"Failed to parse {url}: {e}")
            return None

scraper_v2 = ScraperV2()
