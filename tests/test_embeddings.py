import pytest
from embeddings import (
    get_model,
    sliding_window_chunks,
    compute_similarities,
    find_link_opportunities,
)


def test_sliding_window_chunks_basic():
    """Chunks text into overlapping windows of ~100-150 words."""
    text = " ".join(f"word{i}" for i in range(300))
    chunks = sliding_window_chunks(text, window_size=100, overlap=30)
    assert len(chunks) >= 3
    for chunk_text, start_idx, end_idx in chunks:
        word_count = len(chunk_text.split())
        assert 50 <= word_count <= 130
    assert chunks[1][1] < chunks[0][2]


def test_sliding_window_chunks_short_text():
    """Short text returns a single chunk."""
    text = "This is a short piece of text about Audi leasing."
    chunks = sliding_window_chunks(text, window_size=100, overlap=30)
    assert len(chunks) == 1
    assert chunks[0][0] == text


def test_sliding_window_chunks_preserves_char_positions():
    """start_idx and end_idx map back to original text."""
    text = "First sentence here. Second sentence here. Third sentence here."
    chunks = sliding_window_chunks(text, window_size=5, overlap=2)
    for chunk_text, start_idx, end_idx in chunks:
        assert text[start_idx:end_idx].strip() == chunk_text.strip()


def test_compute_similarities_returns_scores():
    """Returns a list of (target_index, similarity_score) tuples."""
    model = get_model()
    source_text = "Our Audi lease deals offer competitive monthly rates on the A3 and Q5."
    target_titles = [
        "Audi Lease Deals",
        "BMW Contract Hire",
        "Tesla PCP Finance",
    ]
    scores = compute_similarities(model, source_text, target_titles)
    assert len(scores) == 3
    assert scores[0][1] > scores[1][1]
    assert scores[0][1] > scores[2][1]


def test_find_link_opportunities_returns_matches():
    """End-to-end: finds relevant target pages for source content windows."""
    source_content = (
        "Our Audi lease deals offer competitive monthly rates across the A3, A4 and Q5 range. "
        "Whether you are looking for personal or business Audi leasing, we have options to suit every budget. "
        "Meanwhile, BMW contract hire continues to grow in popularity among fleet managers. "
        "The BMW 3 Series and 5 Series are our most popular contract hire vehicles. "
        "For those interested in electric vehicles, our Tesla PCP deals provide flexible finance options. "
        "The Tesla Model 3 and Model Y are available with competitive PCP rates."
    )
    targets = [
        {"url": "/audi/lease-deals", "title": "Audi Lease Deals"},
        {"url": "/bmw/contract-hire", "title": "BMW Contract Hire"},
        {"url": "/tesla/pcp-deals", "title": "Tesla PCP Finance Deals"},
    ]
    matches = find_link_opportunities(source_content, targets, threshold=0.4)
    assert len(matches) >= 1
    for match in matches:
        assert "target_url" in match
        assert "target_title" in match
        assert "similarity" in match
        assert "matched_text" in match
        assert "start_idx" in match
        assert "end_idx" in match
        assert 0.0 <= match["similarity"] <= 1.0


def test_find_link_opportunities_respects_threshold():
    """No matches returned below threshold."""
    source_content = "The weather today is sunny with a chance of rain in the afternoon."
    targets = [
        {"url": "/audi/lease-deals", "title": "Audi Lease Deals"},
    ]
    matches = find_link_opportunities(source_content, targets, threshold=0.7)
    assert len(matches) == 0
