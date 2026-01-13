import re

# Positive keywords that might indicate detailed/good content
POSITIVE_KEYWORDS = ['analysis', 'report', 'study', 'interview', 'exclusive', 'review']

# Negative keywords (clickbaity or low quality)
NEGATIVE_KEYWORDS = ['shocking', 'you won\'t believe', 'omg', 'viral', 'just in']

def calculate_quality_score(article_data):
    """
    Calculate a quality score (0.0 to 10.0) for an article.
    
    Factors:
    - Content Length (longer is often better for news, up to a point)
    - Presence of Image
    - Title quality
    - Source reputation (simplified)
    """
    score = 5.0  # Base score
    
    content = article_data.get('content', '') or ''
    title = article_data.get('title', '') or ''
    image = article_data.get('image')
    
    # 1. Content Length
    word_count = len(content.split())
    if word_count < 100:
        score -= 3.0 # Too short
    elif word_count < 300:
        score -= 1.0
    elif word_count > 800:
        score += 2.0 # In-depth
    elif word_count > 500:
        score += 1.0
        
    # 2. Image Presence
    if image:
        score += 1.0
    else:
        score -= 1.0
        
    # 3. Title Check
    title_lower = title.lower()
    for kw in NEGATIVE_KEYWORDS:
        if kw in title_lower:
            score -= 2.0
            break
            
    for kw in POSITIVE_KEYWORDS:
        if kw in title_lower:
            score += 0.5
            
    # 4. Basic formatting check (does it have paragraphs?)
    if '\n' in content and content.count('\n') > 2:
        score += 0.5
        
    # Clamp score
    return max(0.0, min(10.0, score))
