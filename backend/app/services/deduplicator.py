import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Optional ML imports
try:
    import torch
    from sentence_transformers import SentenceTransformer, util
    ML_AVAILABLE = True
except ImportError:
    logger.warning("ML modules (torch/sentence-transformers) not found. Deduplication disabled.")
    ML_AVAILABLE = False

class Deduplicator:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.device = "cpu"
        self.model = None
        self.disabled_reason: Optional[str] = None

        if ML_AVAILABLE:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("Deduplicator configured for %s (lazy load)", self.device)

    def _ensure_model(self):
        if not ML_AVAILABLE:
            return None

        if self.disabled_reason:
            return None

        if self.model is not None:
            return self.model

        try:
            self.model = SentenceTransformer(self.model_name).to(self.device)
            logger.info("Deduplicator model loaded on %s", self.device)
        except Exception as exc:
            self.disabled_reason = str(exc)
            self.model = None
            logger.warning("Deduplicator disabled: %s", exc)

        return self.model

    def get_embedding(self, text: str) -> List[float]:
        model = self._ensure_model()
        if not model:
            return []

        try:
            embedding = model.encode(text, convert_to_tensor=True)
            return embedding.tolist()
        except Exception as exc:
            logger.warning("Embedding generation failed: %s", exc)
            return []

    def is_duplicate(self, new_embedding_list: List[float], existing_embeddings: List[List[float]], threshold: float = 0.9) -> bool:
        if not ML_AVAILABLE or not new_embedding_list or not existing_embeddings:
            return False
            
        new_emb = torch.tensor(new_embedding_list).to(self.device)
        exist_embs = torch.tensor(existing_embeddings).to(self.device)
        
        # Compute cosine similarity
        similarities = util.cos_sim(new_emb, exist_embs)[0]
        max_sim = torch.max(similarities).item()
        
        return max_sim > threshold

    def is_duplicate_title(self, new_title: str, existing_titles: List[str], threshold: float = 0.65) -> bool:
        """
        Lightweight fallback title similarity check using Jaccard index.
        Cleans and splits titles into word sets to compare overlap.
        """
        if not new_title or not existing_titles:
            return False

        def clean_tokens(title: str):
            import re
            cleaned = re.sub(r'[^\w\s]', '', title.lower())
            return set(cleaned.split())

        new_tokens = clean_tokens(new_title)
        if not new_tokens:
            return False

        for title in existing_titles:
            exist_tokens = clean_tokens(title)
            if not exist_tokens:
                continue
            intersection = len(new_tokens & exist_tokens)
            union = len(new_tokens | exist_tokens)
            jaccard = intersection / union if union > 0 else 0
            if jaccard > threshold:
                logger.info(f"Duplicate title detected (Jaccard: {jaccard:.2f}): '{new_title}' matches '{title}'")
                return True
        return False

# Singleton instance
deduplicator = Deduplicator()
