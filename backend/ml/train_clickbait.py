import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_clickbait.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "clickbait_model.joblib")

def load_data(path=DATA_PATH):
    return pd.read_csv(path)

def train():
    df = load_data()
    X = df['headline'].astype(str)
    y = df['is_clickbait']
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=3000)),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    pipe.fit(X, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)
    print('Saved clickbait model to', MODEL_PATH)

if __name__ == '__main__':
    train()
