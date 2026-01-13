from database import SessionLocal
from models import Interaction, Article
from collections import Counter
from sqlalchemy import desc

def user_profile_vector(user_id):
    db = SessionLocal()
    likes = db.query(Interaction).filter(Interaction.user_id==user_id, Interaction.liked==True).all()
    counter = Counter()
    for l in likes:
        if l.article and l.article.category:
            counter[l.article.category] += 1
    db.close()
    return counter

def recommend_for_user(user_id, limit=10):
    profile = user_profile_vector(user_id)
    db = SessionLocal()
    articles = db.query(Article).order_by(desc(Article.created_at)).limit(200).all()
    scored = []
    for a in articles:
        score = 0
        if a.category and profile:
            score += profile.get(a.category, 0)
        if not a.is_clickbait:
            score += 0.1
        scored.append((score, a))
    scored.sort(key=lambda x: x[0], reverse=True)
    db.close()
    return [a for s,a in scored[:limit]]
