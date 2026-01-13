import joblib
import os

BASE = os.path.dirname(__file__)
TOPIC_MODEL = os.getenv('TOPIC_MODEL_PATH', os.path.join(BASE, 'models', 'topic_model.joblib'))
CLICKBAIT_MODEL = os.getenv('CLICKBAIT_MODEL_PATH', os.path.join(BASE, 'models', 'clickbait_model.joblib'))

_topic = None
_clickbait = None

def load_models():
    global _topic, _clickbait
    if _topic is None and os.path.exists(TOPIC_MODEL):
        _topic = joblib.load(TOPIC_MODEL)
    if _clickbait is None and os.path.exists(CLICKBAIT_MODEL):
        _clickbait = joblib.load(CLICKBAIT_MODEL)

def predict_topic(text):
    load_models()
    if _topic is None:
        return None
    return _topic.predict([text])[0]

def predict_clickbait(headline):
    load_models()
    if _clickbait is None:
        return False
    return bool(_clickbait.predict([headline])[0])
