import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Per-keyword repeat cap: no single keyword can contribute more than this
# many occurrences to a category score, regardless of how often it appears
# in the text. Prevents "trade" ×30 from overwhelming a category.
# ---------------------------------------------------------------------------
MAX_KEYWORD_OCCURRENCES = 3

# ---------------------------------------------------------------------------
# Custom Keyword Dictionaries per Category
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Keyword signal tiers — weights applied on top of the base length bonus.
#
# HIGH_SIGNAL (3.0×): words that almost never appear outside their own
#   category. E.g. "touchdown" is Sports, "chromosome" is Science, "IPO"
#   is Business.
#
# LOW_SIGNAL (0.4×): ambiguous words that legitimately appear across
#   multiple categories. E.g. "trade" (Sports player trade / Business
#   trade deal), "market" (finance / farmers market), "score" (Sports
#   score / test score), "government" (Politics / World affairs).
#
# Unlisted keywords default to 1.0×.
# ---------------------------------------------------------------------------
KEYWORD_SIGNAL_TIERS: Dict[str, float] = {
    # ── High-signal (3.0×) ────────────────────────────────────────────
    # Technology
    'semiconductor': 3.0, 'cybersecurity': 3.0, 'microsoft': 3.0,
    'google': 3.0, 'apple': 3.0,
    # AI & Startups
    'artificial intelligence': 3.0, 'machine learning': 3.0,
    'deep learning': 3.0, 'openai': 3.0, 'y combinator': 3.0,
    'llm': 3.0, 'neural network': 3.0, 'chatbot': 3.0,
    # Business & Finance
    'nasdaq': 3.0, 'wall street': 3.0, 'federal reserve': 3.0,
    'gdp': 3.0, 'inflation': 3.0, 'earnings': 3.0, 'revenue': 3.0,
    'bitcoin': 3.0,
    # Science
    'nasa': 3.0, 'astronomy': 3.0, 'telescope': 3.0, 'quantum': 3.0,
    'genetics': 3.0, 'archeology': 3.0,
    # Health
    'vaccine': 3.0, 'cancer': 3.0, 'fda': 3.0, 'pharma': 3.0,
    'surgery': 3.0,
    # Education
    'tuition': 3.0, 'curriculum': 3.0, 'edtech': 3.0, 'professor': 3.0,
    # Politics
    'senate': 3.0, 'biden': 3.0, 'trump': 3.0, 'parliament': 3.0,
    'congress': 3.0, 'white house': 3.0, 'legislation': 3.0,
    # World
    'nato': 3.0, 'ukraine': 3.0, 'russia': 3.0, 'israel': 3.0,
    'humanitarian': 3.0, 'refugee': 3.0,
    # Environment
    'global warming': 3.0, 'emission': 3.0, 'glacier': 3.0,
    'biodiversity': 3.0, 'ecology': 3.0,
    # Sports
    'nba': 3.0, 'nfl': 3.0, 'ipl': 3.0, 'fifa': 3.0, 'olympics': 3.0,
    # Culture
    'hollywood': 3.0, 'museum': 3.0, 'celebrity': 3.0,

    # ── Low-signal / ambiguous (0.4×) ─────────────────────────────────
    'trade': 0.4, 'market': 0.4, 'company': 0.4, 'bank': 0.4,
    'tech': 0.4, 'internet': 0.4,
    'ai ': 0.4, 'startup': 0.4,
    'research': 0.4, 'scientists': 0.4, 'earth': 0.4, 'space': 0.4,
    'doctor': 0.4, 'health': 0.4, 'fitness': 0.4, 'diet': 0.4,
    'learning': 0.4, 'school': 0.4, 'student': 0.4,
    'policy': 0.4, 'law': 0.4, 'vote': 0.4, 'government': 0.4,
    'international': 0.4, 'global': 0.4, 'conflict': 0.4, 'border': 0.4,
    'environment': 0.4, 'ocean': 0.4, 'plastic': 0.4,
    'score': 0.4, 'tournament': 0.4,
    'art': 0.4, 'travel': 0.4, 'culture': 0.4, 'film': 0.4,
}

# ---------------------------------------------------------------------------
# Signal boost weights — structured signals are more reliable than keyword
# frequency so they get proportionally higher weight.
# ---------------------------------------------------------------------------
# Signal boost weights — content and headline keywords determine category accuracy
URL_SIGNAL_BOOST = 15.0       # Structural path boost
HINT_CATEGORY_BOOST = 10.0    # Gentle prior boost (does not override strong content keywords)


def _keyword_weight(keyword: str) -> float:
    """Return the effective weight for a single keyword occurrence."""
    base = 2.0 if len(keyword) > 5 else 1.2
    tier_multiplier = KEYWORD_SIGNAL_TIERS.get(keyword.lower(), 1.0)
    return base * tier_multiplier


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
    """Signal 2: Weighted Keyword Scoring with occurrence cap and signal tiers."""
    text = text.lower()
    scores: Dict[str, float] = {cat: 0.0 for cat in CATEGORY_KEYWORDS}

    title_multiplier = 3.0 if is_title else 1.0

    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            raw_matches = len(re.findall(f'\\b{re.escape(kw)}\\b', text))
            capped = min(raw_matches, MAX_KEYWORD_OCCURRENCES)
            scores[cat] += capped * _keyword_weight(kw) * title_multiplier

    return scores


def smart_categorize(title: str, content: str, url: str, hint_category: str = None) -> str:
    """
    Multi-Signal Classifier
    1. Title Keywords (3.0x weight - headline is the strongest signal)
    2. Body Content Keywords (1.0x weight - capped & tier-weighted)
    3. URL Path Signal (Moderate boost)
    4. Hint Category (Gentle tie-breaker)
    """
    # 1. Headline scoring (highest density signal)
    title_scores = classify_by_keywords(title, is_title=True)
    
    # 2. Body content scoring
    body_scores = classify_by_keywords(content[:2500], is_title=False)

    kw_scores: Dict[str, float] = {cat: title_scores[cat] + body_scores[cat] for cat in CATEGORY_KEYWORDS}

    # 3. URL path signal boost
    url_cat = classify_by_url(url)
    if url_cat and url_cat in kw_scores:
        kw_scores[url_cat] += URL_SIGNAL_BOOST

    # 4. Hint category boost (gentle tie-breaker)
    if hint_category and hint_category in kw_scores:
        kw_scores[hint_category] += HINT_CATEGORY_BOOST

    # Get the best category
    best_cat = max(kw_scores, key=kw_scores.get)

    if kw_scores[best_cat] < 2.0:
        return "General"

    return best_cat
