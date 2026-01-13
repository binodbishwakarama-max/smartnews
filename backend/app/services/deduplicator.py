import logging
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Optional

logger = logging.getLogger(__name__)

class Deduplicator:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name).to(self.device)
        logger.info(f"Deduplicator loaded on {self.device}")

    def get_embedding(self, text: str) -> List[float]:
        embedding = self.model.encode(text, convert_to_tensor=True)
        return embedding.tolist()

    def is_duplicate(self, new_embedding_list: List[float], existing_embeddings: List[List[float]], threshold: float = 0.9) -> bool:
        if not existing_embeddings:
            return False
            
        new_emb = torch.tensor(new_embedding_list).to(self.device)
        exist_embs = torch.tensor(existing_embeddings).to(self.device)
        
        # Compute cosine similarity
        similarities = util.cos_sim(new_emb, exist_embs)[0]
        max_sim = torch.max(similarities).item()
        
        return max_sim > threshold

# Singleton instance
deduplicator = Deduplicator()
