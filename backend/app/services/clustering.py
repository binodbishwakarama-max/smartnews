import math
import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.article import Article

logger = logging.getLogger(__name__)

# Basic English stopwords to filter out before similarity checking
STOPWORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
    'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
    'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
    'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
    'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
    'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
    'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
    'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
    'your', 'yours', 'yourself', 'yourselves', 'us', 'says', 'said', 'new', 'years', 'first', 'two', 'also'
}

def clean_and_tokenize(text: str) -> list[str]:
    """Lowercase, tokenize, and filter stopwords/non-alphanumeric words."""
    if not text:
        return []
    words = text.lower().split()
    cleaned = []
    for w in words:
        # Strip punctuation
        w_clean = ''.join(c for c in w if c.isalnum())
        if w_clean and w_clean not in STOPWORDS and not w_clean.isdigit():
            cleaned.append(w_clean)
    return cleaned

def calculate_cosine_similarity(tokens1: list[str], tokens2: list[str]) -> float:
    """Calculate Cosine Similarity between term frequency vectors of two token lists."""
    if not tokens1 or not tokens2:
        return 0.0
        
    tf1 = Counter(tokens1)
    tf2 = Counter(tokens2)
    
    vocab = set(tf1.keys()).union(set(tf2.keys()))
    
    dot_product = sum(tf1[word] * tf2[word] for word in vocab)
    
    mag1 = math.sqrt(sum(val**2 for val in tf1.values()))
    mag2 = math.sqrt(sum(val**2 for val in tf2.values()))
    
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
        
    return dot_product / (mag1 * mag2)

def cluster_recent_articles(db: Session, hours: int = 48) -> int:
    """
    Cluster articles from the last N hours.
    Assigns a shared cluster_id to highly similar articles.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    # Fetch all articles from the last N hours
    articles = db.query(Article).filter(
        Article.publish_date >= cutoff
    ).order_by(Article.publish_date.desc()).all()
    
    if not articles:
        return 0
        
    logger.info(f"Clustering {len(articles)} articles published in the last {hours} hours...")
    
    # Tokenize articles lazily
    tokenized_articles = []
    for a in articles:
        combined_text = f"{a.title} {a.summary or ''} {a.content[:500] if a.content else ''}"
        tokens = clean_and_tokenize(combined_text)
        tokenized_articles.append((a, tokens))
        
    clusters_created = 0
    assigned_ids = set()
    
    # Simple single-pass clustering logic
    for i in range(len(tokenized_articles)):
        art_i, tokens_i = tokenized_articles[i]
        
        # If this article has already been clustered in this run, skip
        if art_i.id in assigned_ids:
            continue
            
        cluster_members = [art_i]
        
        for j in range(i + 1, len(tokenized_articles)):
            art_j, tokens_j = tokenized_articles[j]
            
            if art_j.id in assigned_ids:
                continue
                
            # Compute term frequency similarity
            sim = calculate_cosine_similarity(tokens_i, tokens_j)
            
            # Threshold of 0.30 represents high topical overlap for filtered word vectors
            if sim >= 0.30:
                cluster_members.append(art_j)
                
        # If we found duplicates, group them
        if len(cluster_members) > 1:
            # Use the ID of the article with the highest quality score as the cluster identifier
            cluster_id = max(cluster_members, key=lambda x: x.quality_score or 0.0).id
            
            for m in cluster_members:
                m.cluster_id = cluster_id
                assigned_ids.add(m.id)
                db.add(m)
                
            clusters_created += 1
            logger.info(f"Created cluster {cluster_id} with {len(cluster_members)} articles")
            
    try:
        db.commit()
        logger.info(f"Successfully processed clusters. Created: {clusters_created}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save clusters to database: {e}")
        
    return clusters_created
