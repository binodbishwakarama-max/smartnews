import requests
from bs4 import BeautifulSoup
from newspaper import Article as NewsArticle
from datetime import datetime
import time
import logging
import random
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Configuration
REQUEST_TIMEOUT = 15
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
]

SOURCES = [
    'https://www.bbc.com',
    'https://edition.cnn.com',
    'https://timesofindia.indiatimes.com',
    'https://www.theverge.com',
    'https://news.ycombinator.com'
]

def fetch_article(url: str, timeout: int = REQUEST_TIMEOUT, max_retries: int = 3) -> Optional[Dict]:
    """Fetch and parse article from URL with retry logic and user agent rotation"""
    for attempt in range(max_retries):
        try:
            # Rotate user agents to avoid blocking
            headers = {'User-Agent': random.choice(USER_AGENTS)}

            art = NewsArticle(url)
            art.config.browser_user_agent = headers['User-Agent']
            art.download()
            art.parse()

            # Validate we got actual content
            if not art.title or len(art.text.strip()) < 100:
                logger.debug(f'Insufficient content from {url} (attempt {attempt + 1})')
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                return None

            return {
                'title': art.title.strip(),
                'content': art.text.strip(),
                'image': art.top_image,
                'author': ', '.join(art.authors) if art.authors else None,
                'publish_date': art.publish_date or datetime.utcnow(),
                'url': url,
                'summary': art.summary if hasattr(art, 'summary') and art.summary else None
            }

        except Exception as e:
            logger.warning(f'Failed to fetch {url} (attempt {attempt + 1}/{max_retries}): {e}')
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                logger.error(f'Failed to fetch {url} after {max_retries} attempts')

    return None

def scrape_bbc() -> List[str]:
    """Scrape BBC News for article URLs"""
    urls = []
    try:
        headers = {'User-Agent': random.choice(USER_AGENTS)}
        r = requests.get('https://www.bbc.com/news', headers=headers, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()

        soup = BeautifulSoup(r.text, 'html.parser')

        # More specific selectors for BBC news articles
        selectors = [
            'a[href*="/news/"]',
            '.gs-c-promo-heading a',
            '.qa-heading-link a'
        ]

        for selector in selectors:
            for a in soup.select(selector)[:30]:
                href = a.get('href')
                if href:
                    if href.startswith('/'):
                        full_url = 'https://www.bbc.com' + href
                    elif href.startswith('http'):
                        full_url = href
                    else:
                        continue

                    # Filter for actual news articles
                    if '/news/' in full_url and not any(skip in full_url for skip in ['/video/', '/audio/', '/live/']):
                        urls.append(full_url)

        return list(set(urls))[:25]  # Return top 25 unique URLs

    except Exception as e:
        logger.error(f'Failed to scrape BBC: {e}')
        return []

def scrape_cnn() -> List[str]:
    """Scrape CNN for article URLs"""
    urls = []
    try:
        headers = {'User-Agent': random.choice(USER_AGENTS)}
        r = requests.get('https://edition.cnn.com', headers=headers, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()

        soup = BeautifulSoup(r.text, 'html.parser')

        # More specific selectors for CNN articles
        selectors = [
            'a[href*="/202"]',  # Articles with dates in URL
            '.container__headline a',
            '.cd__headline a'
        ]

        for selector in selectors:
            for a in soup.select(selector)[:40]:
                href = a.get('href')
                if href:
                    if href.startswith('/'):
                        full_url = 'https://edition.cnn.com' + href
                    elif href.startswith('http'):
                        full_url = href
                    else:
                        continue

                    # Filter for actual news articles
                    if '/202' in full_url and not any(skip in full_url for skip in ['/videos/', '/gallery/', '/live-news/']):
                        urls.append(full_url)

        return list(set(urls))[:25]

    except Exception as e:
        logger.error(f'Failed to scrape CNN: {e}')
        return []

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

def scrape_all(max_articles: int = 100) -> List[Dict]:
    """
    Scrape all configured news sources for articles

    Args:
        max_articles: Maximum number of articles to return

    Returns:
        List of article dictionaries
    """
    logger.info(f'Starting news scraping for up to {max_articles} articles')

    all_urls = []
    scrapers = [
        ('BBC', scrape_bbc),
        ('CNN', scrape_cnn),
        ('Times of India', scrape_timesofindia),
        ('The Verge', scrape_theverge),
        ('Hacker News', scrape_hackernews)
    ]

    # Collect URLs from all sources
    for source_name, scraper_func in scrapers:
        try:
            logger.info(f'Scraping {source_name}...')
            urls = scraper_func()
            logger.info(f'Found {len(urls)} URLs from {source_name}')
            all_urls.extend(urls)
        except Exception as e:
            logger.error(f'Failed to scrape {source_name}: {e}')

    # Deduplicate URLs
    unique_urls = list(set(all_urls))
    logger.info(f'Total unique URLs found: {len(unique_urls)}')

    # Fetch and parse articles
    articles = []
    for i, url in enumerate(unique_urls[:max_articles]):
        if i % 10 == 0:
            logger.info(f'Processing article {i+1}/{min(len(unique_urls), max_articles)}')

        try:
            art = fetch_article(url)
            if art:
                # Extract source from URL
                art['source'] = url.split('/')[2] if '//' in url else 'unknown'
                articles.append(art)

            # Rate limiting - be respectful to news sites
            time.sleep(random.uniform(0.5, 1.5))

        except Exception as e:
            logger.error(f'Error processing {url}: {e}')
            continue

    logger.info(f'Successfully scraped {len(articles)} articles')
    return articles
