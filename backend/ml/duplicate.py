from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def is_duplicate(new_text, existing_texts, threshold=0.9):
    if not existing_texts:
        return False
    texts = existing_texts + [new_text]
    vect = TfidfVectorizer(stop_words='english', max_features=2000)
    X = vect.fit_transform(texts)
    sims = cosine_similarity(X[-1], X[:-1])
    max_sim = np.max(sims)
    return float(max_sim) >= threshold
