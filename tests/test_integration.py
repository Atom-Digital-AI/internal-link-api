import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_full_pipeline_match_then_suggest():
    """
    Integration test: /match-links finds opportunities,
    results could then be passed to /ai/suggest (not tested here as it needs auth).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Find link opportunities
        match_response = await client.post("/match-links", json={
            "source_content": (
                "Looking for a new car? Our Audi lease deals offer some of the most competitive "
                "monthly rates in the UK. From the stylish A3 to the spacious Q5, there is an "
                "Audi for every driver. We also have fantastic BMW contract hire options available "
                "for business users who want premium vehicles at fixed monthly costs."
            ),
            "targets": [
                {"url": "/audi/lease-deals", "title": "Audi Lease Deals UK"},
                {"url": "/bmw/contract-hire", "title": "BMW Contract Hire for Business"},
                {"url": "/ford/finance", "title": "Ford Finance Options"},
            ],
            "threshold": 0.4,
        })

    assert match_response.status_code == 200
    matches = match_response.json()["matches"]
    assert len(matches) >= 1

    # Verify matches are sorted by similarity descending
    for i in range(len(matches) - 1):
        assert matches[i]["similarity"] >= matches[i + 1]["similarity"]

    # Verify match structure
    first = matches[0]
    assert first["target_url"] in ["/audi/lease-deals", "/bmw/contract-hire"]
    assert len(first["matched_text"]) > 0
    assert first["start_idx"] >= 0
    assert first["end_idx"] > first["start_idx"]
