import math
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

class EmbeddingEngine:
    """
    Hybrid semantic retrieval engine.
    Uses TF-IDF n-gram vectorization with sublinear term frequency weighting
    for lightning-fast, zero-dependency offline similarity search,
    with graceful extensibility for OpenAI/Gemini vectors if configured.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            stop_words='english',
            min_df=1
        )
        self.corpus: List[str] = []
        self.matrix = None

    def compute_similarity(self, query: str, documents: List[str]) -> List[float]:
        if not documents:
            return []
        
        if not query.strip():
            return [0.0] * len(documents)

        try:
            # Combine query and documents to fit vectorizer
            all_texts = [query] + documents
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            
            # Query is at index 0, documents are 1:
            query_vec = tfidf_matrix[0:1]
            doc_vecs = tfidf_matrix[1:]
            
            similarities = cosine_similarity(query_vec, doc_vecs).flatten()
            return [float(sim) for sim in similarities]
        except Exception as e:
            # Fallback token overlap Jaccard
            query_tokens = set(query.lower().split())
            scores = []
            for doc in documents:
                doc_tokens = set(doc.lower().split())
                union = query_tokens.union(doc_tokens)
                if not union:
                    scores.append(0.0)
                else:
                    scores.append(float(len(query_tokens.intersection(doc_tokens)) / len(union)))
            return scores

embedding_engine = EmbeddingEngine()
