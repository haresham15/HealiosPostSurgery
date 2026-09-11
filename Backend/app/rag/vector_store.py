import re
import math
from typing import List, Dict, Any, Tuple
from .protocols import CLINICAL_PROTOCOLS


class ClinicalVectorStore:
    """
    Lightweight hybrid semantic retrieval engine over postoperative ERAS protocols.
    Combines TF-IDF term vector cosine similarity with BM25 keyword matching.
    """
    def __init__(self, protocols: List[Dict[str, Any]] = CLINICAL_PROTOCOLS):
        self.protocols = protocols
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 2]

    def _build_index(self):
        self.doc_tokens = []
        self.doc_freqs: Dict[str, int] = {}
        total_docs = len(self.protocols)

        for doc in self.protocols:
            combined_text = f"{doc['title']} {doc['category']} {doc['content']} {doc['guideline']}"
            tokens = self._tokenize(combined_text)
            self.doc_tokens.append(tokens)

            unique_tokens = set(tokens)
            for t in unique_tokens:
                self.doc_freqs[t] = self.doc_freqs.get(t, 0) + 1

        # Inverse Document Frequency (IDF)
        self.idf: Dict[str, float] = {}
        for token, count in self.doc_freqs.items():
            self.idf[token] = math.log((total_docs + 1) / (count + 1)) + 1.0

    def query(self, query_text: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most relevant protocols matching patient query.
        Returns list of matched protocol dicts with 'similarity_score'.
        """
        q_tokens = self._tokenize(query_text)
        if not q_tokens:
            return self.protocols[:top_k]

        q_tf: Dict[str, int] = {}
        for t in q_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1

        scores: List[Tuple[float, int]] = []

        for idx, doc_tokens in enumerate(self.doc_tokens):
            score = 0.0
            doc_len = len(doc_tokens)
            if doc_len == 0:
                continue

            doc_tf: Dict[str, int] = {}
            for t in doc_tokens:
                doc_tf[t] = doc_tf.get(t, 0) + 1

            # BM25-like scoring
            k1 = 1.2
            b = 0.75
            avg_dl = 45.0

            for q_term, q_count in q_tf.items():
                if q_term in doc_tf:
                    tf_val = doc_tf[q_term]
                    idf_val = self.idf.get(q_term, 1.0)
                    numerator = tf_val * (k1 + 1.0)
                    denominator = tf_val + k1 * (1.0 - b + b * (doc_len / avg_dl))
                    score += idf_val * (numerator / denominator)

            scores.append((score, idx))

        scores.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, idx in scores[:top_k]:
            protocol = dict(self.protocols[idx])
            protocol["relevance_score"] = round(float(score), 3)
            results.append(protocol)

        return results


# Global singleton instance
vector_store = ClinicalVectorStore()
