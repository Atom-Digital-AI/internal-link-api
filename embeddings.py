"""Semantic matching using sentence embeddings for internal link opportunity detection."""

import logging
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Load and cache the sentence transformer model (singleton)."""
    logger.info("Loading sentence-transformer model: %s", MODEL_NAME)
    return SentenceTransformer(MODEL_NAME)


def sliding_window_chunks(
    text: str,
    window_size: int = 120,
    overlap: int = 30,
) -> list[tuple[str, int, int]]:
    """
    Split text into overlapping word-based windows with character positions.

    Returns:
        List of (chunk_text, start_char_idx, end_char_idx) tuples.
    """
    words = text.split()
    if len(words) <= window_size:
        return [(text.strip(), 0, len(text))]

    chunks = []
    step = window_size - overlap
    word_positions = []
    pos = 0
    for word in words:
        idx = text.index(word, pos)
        word_positions.append(idx)
        pos = idx + len(word)

    for i in range(0, len(words), step):
        window_words = words[i : i + window_size]
        if not window_words:
            break
        start_char = word_positions[i]
        end_word_idx = min(i + len(window_words) - 1, len(words) - 1)
        end_char = word_positions[end_word_idx] + len(words[end_word_idx])
        chunk_text = text[start_char:end_char]
        chunks.append((chunk_text, start_char, end_char))
        if i + window_size >= len(words):
            break

    return chunks


def compute_similarities(
    model: SentenceTransformer,
    source_text: str,
    target_titles: list[str],
) -> list[tuple[int, float]]:
    """
    Compute cosine similarity between a source text and target titles.

    Returns:
        List of (target_index, similarity_score) sorted by score descending.
    """
    if not target_titles:
        return []

    all_texts = [source_text] + target_titles
    embeddings = model.encode(all_texts, normalize_embeddings=True)

    source_embedding = embeddings[0]
    target_embeddings = embeddings[1:]

    similarities = np.dot(target_embeddings, source_embedding)

    results = [(i, float(sim)) for i, sim in enumerate(similarities)]
    results.sort(key=lambda x: x[1], reverse=True)
    return results


def find_link_opportunities(
    source_content: str,
    targets: list[dict],
    threshold: float = 0.7,
    window_size: int = 120,
    overlap: int = 30,
) -> list[dict]:
    """
    Find internal link opportunities by matching source content windows to target pages.

    Returns:
        List of match dicts sorted by similarity descending (one per target, best window only).
    """
    if not source_content or not targets:
        return []

    model = get_model()
    chunks = sliding_window_chunks(source_content, window_size, overlap)
    target_titles = [t["title"] for t in targets]

    matches = []
    seen_targets = set()

    all_pairs = []
    for chunk_text, start_idx, end_idx in chunks:
        scores = compute_similarities(model, chunk_text, target_titles)
        for target_idx, similarity in scores:
            if similarity >= threshold:
                all_pairs.append({
                    "target_url": targets[target_idx]["url"],
                    "target_title": targets[target_idx]["title"],
                    "similarity": round(similarity, 4),
                    "matched_text": chunk_text,
                    "start_idx": start_idx,
                    "end_idx": end_idx,
                })

    all_pairs.sort(key=lambda x: x["similarity"], reverse=True)
    for pair in all_pairs:
        if pair["target_url"] not in seen_targets:
            seen_targets.add(pair["target_url"])
            matches.append(pair)

    return matches
