import logging
import re
from typing import Dict, List

logger = logging.getLogger(__name__)

# Custom Keyword Dictionaries per Category
CATEGORY_KEYWORDS = {
    'Technology': ['tech', 'software', 'hardware', 'google', 'apple', 'meta', 'microsoft', 'semiconductor', 'cybersecurity', 'gadget', 'computing', 'internet', 'broadband'],
    'AI & Startups': ['ai ', 'artificial intelligence', 'machine learning', 'deep learning', 'openai', 'startup', 'venture capital', 'funding round', 'unicorn', 'y combinator', 'llm', 'chatbot', 'neural network'],
    'Business & Finance': ['market', 'stock', 'economy', 'ceo', 'company', 'finance', 'inflation', 'trade', 'bank', 'earnings', 'revenue', 'wall street', 'nasdaq', 'crypto', 'bitcoin', 'federal reserve', 'gdp'],
    'Science': ['nasa', 'space', 'research', 'scientists', 'biology', 'physics', 'astronomy', 'planet', 'earth', 'telescope', 'quantum', 'evolution', 'genetics', 'archeology'],
    'Health': ['medicine', 'doctor', 'virus', 'health', 'fitness', 'vaccine', 'hospital', 'cancer', 'diet', 'medical', 'brain', 'mental health', 'fda', 'pharma', 'surgery'],
    'Education': ['university', 'college', 'school', 'student', 'education', 'learning', 'tuition', 'academic', 'professor', 'curriculum', 'literacy', 'edtech'],
    'Politics': ['election', 'president', 'government', 'senate', 'biden', 'trump', 'policy', 'parliament', 'vote', 'law', 'congress', 'white house', 'ministry', 'legislation', 'diplomatic'],
    'World': ['international', 'global', 'war ', 'conflict', 'un ', 'nato', 'ukraine', 'russia', 'china', 'israel', 'border', 'foreign policy', 'humanitarian', 'refugee'],
    'Environment': ['climate', 'global warming', 'environment', 'sustainability', 'renewable', 'carbon', 'emission', 'wildlife', 'conservation', 'pollution', 'plastic', 'ocean', 'glacier', 'ecology', 'biodiversity'],
    'Sports': ['football', 'soccer', 'basketball', 'nba', 'nfl', 'cricket', 'tennis', 'olympics', 'stadium', 'athlete', 'championship', 'tournament', 'ipl', 'fifa', 'score'],
    'Culture': ['art', 'music', 'movie', 'film', 'theater', 'culture', 'fashion', 'lifestyle', 'entertainment', 'celebrity', 'travel', 'hollywood', 'museum'],
}

def classify_by_url(url: str) -> str:
    """Signal 1: Source path signal"""
    url = url.lower()
    mapping = {
        '/technology': 'Technology',
        '/tech/': 'Technology',
        '/business': 'Business & Finance',
        '/economy': 'Business & Finance',
        '/finance': 'Business & Finance',
        '/science': 'Science',
        '/health': 'Health',
        '/education': 'Education',
        '/politics': 'Politics',
        '/world': 'World',
        '/environment': 'Environment',
        '/climate': 'Environment',
        '/ai': 'AI & Startups',
        '/startups': 'AI & Startups',
        '/sports': 'Sports',
        '/sport/': 'Sports'
    }
    for path, cat in mapping.items():
        if path in url:
            return cat
    return None

def classify_by_keywords(text: str) -> Dict[str, float]:
    """Signal 2: Weighted Keyword Scoring"""
    text = text.lower()
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS.keys()}
    
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            # Use regex to find whole words/phrases
            matches = len(re.findall(f'\\b{re.escape(kw)}\\b', text))
            scores[cat] += matches * 1.5 if len(kw) > 5 else matches
            
    return scores

def smart_categorize(title: str, content: str, url: str, hint_category: str = None) -> str:
    """
    Multi-Signal Classifier
    1. Hint Category from Feed (Highest weight)
    2. URL Path Signal (High weight)
    3. Keyword Density (Medium weight)
    """
    full_text = f"{title} {title} {content}" 
    
    # 1. Keyword scores base
    kw_scores = classify_by_keywords(full_text)
    
    # 2. URL signal boost
    url_cat = classify_by_url(url)
    if url_cat:
        kw_scores[url_cat] += 10
        
    # 3. Hint category boost (Massive weight since it comes from a trusted feed)
    if hint_category and hint_category in kw_scores:
        kw_scores[hint_category] += 25
        
    # Get the best category
    best_cat = max(kw_scores, key=kw_scores.get)
    
    if kw_scores[best_cat] < 2:
        return "General"
        
    return best_cat
