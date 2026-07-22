import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Per-keyword repeat cap: no single keyword can contribute more than this
# many occurrences to a category score.
# ---------------------------------------------------------------------------
MAX_KEYWORD_OCCURRENCES = 3

# ---------------------------------------------------------------------------
# High-Precision Keyword Dictionaries per Category
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS = {
    'Technology': [
        'tech', 'software', 'hardware', 'google', 'apple', 'meta', 'microsoft', 
        'semiconductor', 'cybersecurity', 'gadget', 'computing', 'internet', 'broadband',
        'smartphone', 'app store', 'operating system', 'cloud', 'cyber', 'developer', 'chip'
    ],
    'AI & Startups': [
        'ai ', 'artificial intelligence', 'machine learning', 'deep learning', 'openai', 
        'gemini', 'claude', 'chatgpt', 'llm', 'startup', 'venture capital', 'funding round', 
        'unicorn', 'y combinator', 'chatbot', 'neural network', 'generative ai', 'foundation model'
    ],
    'Business & Finance': [
        'market', 'stock', 'economy', 'ceo', 'company', 'finance', 'inflation', 'trade', 
        'bank', 'earnings', 'revenue', 'wall street', 'nasdaq', 'crypto', 'bitcoin', 
        'federal reserve', 'gdp', 'shares', 'quarterly', 'profit', 'rbi', 'investor'
    ],
    'Science': [
        'nasa', 'space', 'research', 'scientists', 'biology', 'physics', 'astronomy', 
        'planet', 'earth', 'telescope', 'quantum', 'evolution', 'genetics', 'archeology'
    ],
    'Health': [
        'medicine', 'doctor', 'virus', 'health', 'fitness', 'vaccine', 'hospital', 
        'cancer', 'diet', 'medical', 'brain', 'mental health', 'fda', 'pharma', 
        'surgery', 'outbreak', 'patient', 'therapy', 'treatment'
    ],
    'Education': [
        'university', 'college', 'school', 'student', 'education', 'learning', 
        'tuition', 'academic', 'professor', 'curriculum', 'literacy', 'edtech', 'exam'
    ],
    'Politics': [
        'protest', 'protesters', 'jantar mantar', 'rally', 'demonstration', 'strike', 
        'court', 'supreme court', 'police', 'minister', 'bjp', 'congress', 'opposition', 
        'parliament', 'election', 'president', 'government', 'senate', 'biden', 'trump', 
        'policy', 'vote', 'law', 'white house', 'ministry', 'legislation', 'diplomatic', 
        'governor', 'activist', 'bureaucrat', 'cabinet', 'mla', 'mp'
    ],
    'World': [
        'international', 'global', 'war ', 'conflict', 'un ', 'nato', 'ukraine', 
        'russia', 'china', 'israel', 'border', 'foreign policy', 'humanitarian', 
        'refugee', 'gaza', 'diplomacy'
    ],
    'Environment': [
        'climate', 'global warming', 'environment', 'sustainability', 'renewable', 
        'carbon', 'emission', 'wildlife', 'conservation', 'pollution', 'plastic', 
        'ocean', 'glacier', 'ecology', 'biodiversity'
    ],
    'Sports': [
        'football', 'soccer', 'basketball', 'nba', 'nfl', 'cricket', 'tennis', 
        'olympics', 'stadium', 'athlete', 'championship', 'tournament', 'ipl', 
        'fifa', 'score', 'trophy', 'match', 'wicket'
    ],
    'Culture': [
        'art', 'music', 'movie', 'film', 'theater', 'culture', 'fashion', 
        'lifestyle', 'entertainment', 'celebrity', 'travel', 'hollywood', 
        'museum', 'bollywood', 'concert'
    ],
}

# ── High-Signal Tiers ────────────────────────────────────────────────────────
KEYWORD_SIGNAL_TIERS: Dict[str, float] = {
    # High-signal (3.5x)
    'protest': 3.5, 'protesters': 3.5, 'jantar mantar': 4.0, 'demonstration': 3.5,
    'rally': 3.5, 'strike': 3.5, 'supreme court': 3.5, 'parliament': 3.5,
    'bjp': 3.5, 'congress': 3.5, 'semiconductor': 3.5, 'cybersecurity': 3.5,
    'artificial intelligence': 3.5, 'machine learning': 3.5, 'openai': 3.5,
    'chatgpt': 3.5, 'nasdaq': 3.5, 'wall street': 3.5, 'inflation': 3.5,
    'nasa': 3.5, 'vaccine': 3.5, 'hospital': 3.5, 'cricket': 3.5, 'ipl': 3.5,
    'fifa': 3.5, 'olympics': 3.5, 'hollywood': 3.5,

    # Low-signal / ambiguous (0.4x)
    'trade': 0.4, 'market': 0.4, 'company': 0.4, 'tech': 0.4, 'ai ': 0.4,
    'health': 0.4, 'school': 0.4, 'policy': 0.4, 'law': 0.4, 'government': 0.4,
}

# Signal boost weights
URL_SIGNAL_BOOST = 2.0       # Structural path boost (lowered so content overrides URL)
HINT_CATEGORY_BOOST = 1.5    # Gentle prior tie-breaker

def _keyword_weight(kw: str) -> float:
    return KEYWORD_SIGNAL_TIERS.get(kw.lower(), 1.0)

def classify_by_url(url: str) -> Optional[str]:
    """Signal 1: Source path signal"""
    url = url.lower()
    mapping = {
        '/technology': 'Technology',
        '/tech/': 'Technology',
        '/business': 'Business & Finance',
        '/economy': 'Business & Finance',
        '/finance': 'Business & Finance',
        '/markets': 'Business & Finance',
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
        '/sport/': 'Sports',
        '/cricket': 'Sports'
    }
    for path, cat in mapping.items():
        if path in url:
            return cat
    return None

def classify_by_keywords(text: str, is_title: bool = False) -> Dict[str, float]:
    """Signal 2: Weighted Keyword Scoring with title multiplier."""
    text = text.lower()
    scores: Dict[str, float] = {cat: 0.0 for cat in CATEGORY_KEYWORDS}
    title_multiplier = 4.0 if is_title else 1.0

    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            raw_matches = len(re.findall(f'\\b{re.escape(kw)}\\b', text))
            capped = min(raw_matches, MAX_KEYWORD_OCCURRENCES)
            scores[cat] += capped * _keyword_weight(kw) * title_multiplier

    return scores

def smart_categorize(title: str, content: str, url: str = "", hint_category: str = None) -> str:
    """
    High-Precision NLP Categorization Algorithm:
    1. Title Keywords (4.0x multiplier - title is strongest indicator)
    2. Body Content Keywords (1.0x multiplier)
    3. Structural URL Path (2.0 tie-breaker)
    4. Source Hint (1.5 tie-breaker)
    """
    title_scores = classify_by_keywords(title or '', is_title=True)
    body_scores = classify_by_keywords((content or '')[:3000], is_title=False)

    kw_scores: Dict[str, float] = {cat: title_scores[cat] + body_scores[cat] for cat in CATEGORY_KEYWORDS}

    # URL path tie-breaker
    if url:
        url_cat = classify_by_url(url)
        if url_cat and url_cat in kw_scores:
            kw_scores[url_cat] += URL_SIGNAL_BOOST

    # Hint category tie-breaker
    if hint_category and hint_category in kw_scores:
        kw_scores[hint_category] += HINT_CATEGORY_BOOST

    # Return top category if score > 0, otherwise fallback to hint or General
    sorted_cats = sorted(kw_scores.items(), key=lambda x: x[1], reverse=True)
    best_cat, best_score = sorted_cats[0]

    if best_score > 1.0:
        return best_cat
    
    if hint_category and hint_category in CATEGORY_KEYWORDS:
        return hint_category
        
    return 'General'
