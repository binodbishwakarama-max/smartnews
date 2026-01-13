import textstat
import ftfy
import re

class QualityEngine:
    def clean_text(self, text: str) -> str:
        """Removes unicode clutter, normalizes whitespace, and strips ads."""
        if not text: return ""
        
        # Unicorn de-cluttering
        text = ftfy.fix_text(text)
        
        # Remove common "read more" patterns
        text = re.sub(r'Read more.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Subscribe to.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Sign up.*', '', text, flags=re.IGNORECASE)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        return text

    def calculate_quality_score(self, content: str, title: str) -> dict:
        """
        Generates a quality score (0-100) based on heuristics.
        """
        score = 50.0 # Base score
        
        if not content:
            return {"score": 0, "readability": 0}

        word_count = len(content.split())
        
        # 1. Length Penalties/Bonuses
        if word_count < 100: score -= 30
        elif word_count > 500: score += 10
        elif word_count > 1000: score += 20
        
        # 2. Readability (Flesch Reading Ease)
        # 60-70 is standard. Higher is easier. Lower is academic.
        # We want accessible but smart (50-70 range).
        try:
            readability = textstat.flesch_reading_ease(content)
        except:
            readability = 50.0

        if 50 <= readability <= 70: score += 10
        elif readability < 30: score -= 10 # Too dense
        
        # 3. Title Check (Clickbait Filter)
        clickbait_terms = ['shocking', 'won\'t believe', 'you need to see', 'omg']
        if any(term in title.lower() for term in clickbait_terms):
            score -= 25
            
        # 4. Uppercase Abuse
        if title.isupper():
            score -= 20
            
        return {
            "score": max(0, min(100, score)),
            "readability": readability
        }

    def compute_feed_score(self, quality_score: float, publish_date: str) -> float:
        """
        Rank = Quality (50%) + Freshness (50%)
        """
        # Simple placeholder for freshness decay
        # In prod, subtract hours_old * decay_factor
        return quality_score # For now just quality dominated

quality_engine = QualityEngine()
