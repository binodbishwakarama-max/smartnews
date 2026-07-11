import hashlib
import logging
import math
import textstat
import ftfy
import re

logger = logging.getLogger(__name__)

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

    # Tunable constants for Option 1 Continuous Scoring
    SIGMA = 20.0
    BASE_SCORE = 20.0
    LENGTH_WEIGHT = 40.0
    READABILITY_WEIGHT = 40.0

    def _calculate_readability(self, content: str) -> float:
        """
        Calculates the Flesch reading ease score of the text.
        Optimized to use a representative sample (first 300 words) to prevent CPU/GIL spikes
        on extremely large articles.
        """
        try:
            words = content.split()
            if not words:
                return 65.0
            # Sample first 300 words for performance optimization
            sample = " ".join(words[:300])
            # Remove any residual HTML/markup or strange characters
            clean_sample = re.sub(r'<[^>]*>', '', sample)
            return textstat.flesch_reading_ease(clean_sample)
        except Exception as e:
            logger.warning(f"Failed to calculate readability ease: {e}")
            return 65.0  # Fallback to standard reading ease average

    def calculate_quality_score(self, content: str, title: str) -> dict:
        """
        Generates a quality score (0-100) based on continuous heuristics.
        """

        if not content:
            return {
                "score": 0.0,
                "readability": 0.0,
                "length_score": 0.0,
                "readability_sub_score": 0.0,
                "clickbait_penalty": 0.0,
                "caps_penalty": 0.0
            }

        word_count = len(content.split())
        
        # 1. Continuous Length Score (Logarithmic curve)
        # 20 * log(word_count/100 + 1) / log(11), scaled to LENGTH_WEIGHT
        length_score = min(
            self.LENGTH_WEIGHT,
            self.LENGTH_WEIGHT * math.log(word_count / 100.0 + 1.0) / math.log(11.0)
        )
        
        # 2. Continuous Readability Score (Gaussian curve centered at 65)
        readability = self._calculate_readability(content)

        readability_sub_score = self.READABILITY_WEIGHT * math.exp(
            -((readability - 65.0) ** 2) / (2.0 * (self.SIGMA ** 2))
        )
        
        # 3. Categorical Penalties
        clickbait_terms = ['shocking', 'won\'t believe', 'you need to see', 'omg']
        clickbait_penalty = 0.0
        if any(term in title.lower() for term in clickbait_terms):
            clickbait_penalty = -25.0
            
        caps_penalty = 0.0
        if title.isupper():
            caps_penalty = -20.0

        # Total score calculation
        total_score = self.BASE_SCORE + length_score + readability_sub_score + clickbait_penalty + caps_penalty

        # --- Asymptotic compression (exponential, no flat ceiling) ---
        # Top compression: scores above 70 smoothly approach ~97
        if total_score > 70.0:
            excess = total_score - 70.0
            total_score = 70.0 + 27.0 * (1.0 - math.exp(-excess / 20.0))

        # Bottom compression: scores below 30 smoothly approach ~5
        if total_score < 30.0:
            deficit = 30.0 - total_score
            total_score = 30.0 - 25.0 * (1.0 - math.exp(-deficit / 20.0))

        # --- Deterministic micro-jitter for per-article uniqueness ---
        # Hash the content+title to produce a stable, tiny offset (±0.05)
        # so two articles with identical raw scores still get distinct finals.
        hash_input = f"{title}|{content[:200]}".encode("utf-8", errors="replace")
        digest = hashlib.md5(hash_input).hexdigest()
        jitter = (int(digest[:8], 16) / 0xFFFFFFFF - 0.5) * 0.1  # range: -0.05 to +0.05
        total_score += jitter

        # Safety floor/ceiling (should almost never bind given the curves above)
        final_score = max(5.0, min(95.0, total_score))

        return {
            "score": final_score,
            "readability": readability,
            "length_score": round(length_score, 2),
            "readability_sub_score": round(readability_sub_score, 2),
            "clickbait_penalty": clickbait_penalty,
            "caps_penalty": caps_penalty
        }

    def compute_feed_score(self, quality_score: float, publish_date: str) -> float:
        """
        Rank = Quality (50%) + Freshness (50%)
        """
        # Simple placeholder for freshness decay
        # In prod, subtract hours_old * decay_factor
        return quality_score # For now just quality dominated

quality_engine = QualityEngine()
