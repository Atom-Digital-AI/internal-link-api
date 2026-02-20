import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_match_links_returns_matches():
    """POST /match-links returns semantic matches."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/match-links", json={
            "source_content": (
                "Our Audi lease deals offer competitive monthly rates across the A3, A4 and Q5 range. "
                "Whether you are looking for personal or business Audi leasing, we have great options."
            ),
            "targets": [
                {"url": "/audi/lease-deals", "title": "Audi Lease Deals"},
                {"url": "/bmw/contract-hire", "title": "BMW Contract Hire"},
            ],
            "threshold": 0.4,
        })
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) >= 1
    assert data["matches"][0]["target_url"] == "/audi/lease-deals"


@pytest.mark.asyncio
async def test_match_links_empty_content():
    """POST /match-links with empty content returns no matches."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/match-links", json={
            "source_content": "",
            "targets": [{"url": "/audi/lease-deals", "title": "Audi Lease Deals"}],
        })
    assert response.status_code == 200
    assert response.json()["matches"] == []
