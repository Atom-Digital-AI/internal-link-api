import asyncio
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from models import (
    HealthResponse,
    ConfigResponse,
    SitemapRequest,
    SitemapResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    BulkAnalyzeRequest,
    BulkAnalyzeResponse,
    BulkSummary,
)
from sitemap_parser import fetch_sitemap
from scraper import analyze_page, analyze_page_summary

# Configurable limits via environment variables
MAX_BULK_URLS = int(os.environ.get("MAX_BULK_URLS", "100"))

app = FastAPI(
    title="Internal Link Finder API",
    description="API for analyzing internal links on websites",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"https://.*\.(web\.app|firebaseapp\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health check for Railway."""
    return HealthResponse(status="ok", version="1.0.0")


@app.get("/config", response_model=ConfigResponse)
async def get_config():
    """Get current API configuration/limits. Useful for UI to know constraints."""
    return ConfigResponse(max_bulk_urls=MAX_BULK_URLS)


@app.post("/sitemap", response_model=SitemapResponse)
async def get_sitemap(request: SitemapRequest):
    """
    Fetch and parse a site's sitemap to get all URLs.
    Filters URLs by source_pattern and target_pattern.
    """
    result = await fetch_sitemap(
        str(request.domain),
        request.source_pattern,
        request.target_pattern,
    )
    return SitemapResponse(**result)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeRequest):
    """
    Scrape a single URL and return link audit data.
    """
    return await analyze_page(str(request.url), request.target_pattern)


@app.post("/bulk-analyze", response_model=BulkAnalyzeResponse)
async def bulk_analyze(request: BulkAnalyzeRequest):
    """
    Analyze multiple URLs with a 1-second delay between requests.
    Flags pages where link_density > threshold OR target_link_count == 0.
    """
    if len(request.urls) > MAX_BULK_URLS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many URLs. Maximum allowed: {MAX_BULK_URLS}, received: {len(request.urls)}"
        )

    results = []
    needs_links = 0
    has_good_density = 0
    failed = 0

    for url in request.urls:
        result = await analyze_page_summary(
            str(url),
            request.target_pattern,
            request.link_ratio_threshold,
        )
        results.append(result)

        if result.status == "failed":
            failed += 1
        elif result.status == "needs_links":
            needs_links += 1
        else:
            has_good_density += 1

        # Be polite - 1 second delay between requests
        if url != request.urls[-1]:
            await asyncio.sleep(1)

    return BulkAnalyzeResponse(
        results=results,
        summary=BulkSummary(
            total_scanned=len(results),
            needs_links=needs_links,
            has_good_density=has_good_density,
            failed=failed,
        ),
    )


# Serve static frontend files if they exist (production build)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Serve static assets (JS, CSS, etc.)
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    # Catch-all route for SPA - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for any non-API routes."""
        # Check if it's a file in static directory
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html for SPA routing
        return FileResponse(static_dir / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
