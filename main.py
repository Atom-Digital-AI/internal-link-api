import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from rate_limit import limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from db_models import BlogPost, User

from embeddings import find_link_opportunities
from models import (
    AnalyzeRequest,
    AnalyzeResponse,
    BulkAnalyzeRequest,
    BulkAnalyzeResponse,
    BulkSummary,
    ConfigResponse,
    FetchTargetRequest,
    HealthResponse,
    LinkMatch,
    MatchLinksRequest,
    MatchLinksResponse,
    SitemapRequest,
    SitemapResponse,
    TargetPageInfo,
)
from scraper import analyze_page, analyze_page_summary, calculate_keyword_relevance, fetch_target_page_content
from sitemap_parser import fetch_sitemap

# New SaaS routers
from auth.router import router as auth_router
from auth.router import user_router
from billing.router import router as billing_router
from sessions.router import router as sessions_router
from links.router import router as links_router
from ai_router.router import router as ai_router
from internal.router import router as internal_router
from blog.router import router as blog_router

# Configurable limits via environment variables
MAX_BULK_URLS = int(os.environ.get("MAX_BULK_URLS", "100"))
CRAWL_PAGE_LIMITS = {"free": 10, "starter": 50, "pro": 500}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Internal Link Finder API",
    description="API for analyzing internal links on websites",
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ---------------------------------------------------------------------------
# Security Headers (added BEFORE CORS — Starlette middleware runs LIFO,
# so security headers execute AFTER CORS, avoiding conflicts)
# ---------------------------------------------------------------------------


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
if _allowed_origins_env:
    allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

if "*" in allowed_origins:
    raise RuntimeError(
        "ALLOWED_ORIGINS cannot contain '*' when allow_credentials=True. "
        "Specify exact origins instead."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Internal-Secret"],
)

# ---------------------------------------------------------------------------
# Include routers
# NOTE: billing/webhook must be included BEFORE auth middleware would block it.
# The billing router itself handles Stripe signature verification.
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(billing_router)
app.include_router(sessions_router)
app.include_router(links_router)
app.include_router(ai_router)
app.include_router(internal_router)
app.include_router(blog_router)


# ---------------------------------------------------------------------------
# Existing endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health check for Railway."""
    return HealthResponse(status="ok", version="2.0.0")


@app.get("/config", response_model=ConfigResponse)
async def get_config():
    """Get current API configuration/limits. Useful for UI to know constraints."""
    return ConfigResponse(max_bulk_urls=MAX_BULK_URLS)


@app.post("/sitemap", response_model=SitemapResponse)
async def get_sitemap(request: SitemapRequest, current_user: User = Depends(get_current_user)):
    """
    Fetch and parse a site's sitemap to get all URLs.
    Filters URLs by source_pattern and target_pattern.
    Falls back to crawling if no sitemap found.
    """
    max_crawl_pages = CRAWL_PAGE_LIMITS.get(current_user.plan, 10)
    result = await fetch_sitemap(
        str(request.domain),
        request.source_pattern,
        request.target_pattern,
        max_crawl_pages=max_crawl_pages,
    )
    return SitemapResponse(**result)


@limiter.limit("30/minute")
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: Request, body: AnalyzeRequest):
    """
    Scrape a single URL and return link audit data.
    """
    return await analyze_page(str(body.url), body.target_pattern)


@limiter.limit("30/minute")
@app.post("/fetch-target", response_model=TargetPageInfo)
async def fetch_target(request: Request, body: FetchTargetRequest):
    """
    Fetch a target page and extract its title and keywords for semantic matching.
    Use this to get keywords for relevance scoring in focused search mode.
    """
    return await fetch_target_page_content(str(body.url))


@limiter.limit("20/minute")
@app.post("/match-links", response_model=MatchLinksResponse)
async def match_links(request: Request, body: MatchLinksRequest):
    """
    Find internal link opportunities using semantic embedding matching.
    Optionally pre-filters targets by keyword relevance before running embeddings.
    """
    targets_as_dicts = [{"url": t.url, "title": t.title} for t in body.targets]

    # Pre-filter: if more targets than max_targets, use keyword relevance to narrow down
    if len(targets_as_dicts) > body.max_targets:
        scored = []
        for t in targets_as_dicts:
            keywords = t["title"].lower().split()
            if body.filter_keyword:
                keywords.append(body.filter_keyword.lower())
            score = calculate_keyword_relevance(body.source_content, keywords)
            scored.append((score, t))
        scored.sort(key=lambda x: x[0], reverse=True)
        targets_as_dicts = [t for _, t in scored[: body.max_targets]]

    matches = find_link_opportunities(
        source_content=body.source_content,
        targets=targets_as_dicts,
        threshold=body.threshold,
    )
    return MatchLinksResponse(
        matches=[LinkMatch(**m) for m in matches]
    )


@limiter.limit("10/minute")
@app.post("/bulk-analyze", response_model=BulkAnalyzeResponse)
async def bulk_analyze(request: Request, body: BulkAnalyzeRequest):
    """
    Analyze multiple URLs with a 1-second delay between requests.
    Classifies pages by link density: low (<0.35%), good (0.35%-0.7%), high (>0.7%).

    Optional filters:
    - filter_target_url: Specific page to build links to (fetches and extracts keywords)
    - filter_keyword: Additional keyword to focus on
    - filter_match_type: "exact" or "stemmed" matching
    """
    if len(body.urls) > MAX_BULK_URLS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many URLs. Maximum allowed: {MAX_BULK_URLS}, received: {len(body.urls)}"
        )

    # Build keyword list for relevance scoring
    filter_keywords: list[str] = []
    target_page_info = None

    # If a target URL is specified, fetch its content and extract keywords
    if body.filter_target_url:
        target_page_info = await fetch_target_page_content(body.filter_target_url)
        filter_keywords.extend(target_page_info.keywords)

    # Add explicit keyword filter if provided
    if body.filter_keyword:
        filter_keywords.append(body.filter_keyword)
        words = body.filter_keyword.split()
        if len(words) > 1:
            filter_keywords.extend(words)

    results = []
    low_density = 0
    good_density = 0
    high_density = 0
    failed = 0

    for url in body.urls:
        result = await analyze_page_summary(
            str(url),
            body.target_pattern,
            filter_keywords=filter_keywords if filter_keywords else None,
            filter_match_type=body.filter_match_type,
        )
        results.append(result)

        if result.status == "failed":
            failed += 1
        elif result.status == "low":
            low_density += 1
        elif result.status == "high":
            high_density += 1
        else:
            good_density += 1

        # Be polite - 1 second delay between requests
        if url != body.urls[-1]:
            await asyncio.sleep(1)

    return BulkAnalyzeResponse(
        results=results,
        summary=BulkSummary(
            total_scanned=len(results),
            low_density=low_density,
            good_density=good_density,
            high_density=high_density,
            failed=failed,
        ),
        target_page_info=target_page_info,
    )


# ---------------------------------------------------------------------------
# Sitemap
# ---------------------------------------------------------------------------

_STATIC_PAGES = [
    {"loc": "/",          "changefreq": "weekly",  "priority": "1.0"},
    {"loc": "/pricing",   "changefreq": "monthly", "priority": "0.9"},
    {"loc": "/features",  "changefreq": "monthly", "priority": "0.8"},
    {"loc": "/blog",      "changefreq": "weekly",  "priority": "0.8"},
    {"loc": "/privacy",   "changefreq": "yearly",  "priority": "0.3"},
    {"loc": "/terms",     "changefreq": "yearly",  "priority": "0.3"},
]

_VS_SLUGS = [
    "link-whisper",
    "linkstorm",
    "inlinks",
    "linkboss",
    "seojuice",
]


def _url_entry(base: str, loc: str, lastmod: str | None = None,
               changefreq: str = "monthly", priority: str = "0.7") -> str:
    parts = [f"  <url>\n    <loc>{base}{loc}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts.append(f"    <changefreq>{changefreq}</changefreq>")
    parts.append(f"    <priority>{priority}</priority>")
    parts.append("  </url>")
    return "\n".join(parts)


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap(db: AsyncSession = Depends(get_db)) -> Response:
    base_url = os.environ.get("SITE_URL", "https://linki.tools").rstrip("/")
    today = datetime.now(timezone.utc).date().isoformat()

    entries: list[str] = []

    # Static pages
    for page in _STATIC_PAGES:
        entries.append(_url_entry(base_url, page["loc"],
                                  lastmod=today,
                                  changefreq=page["changefreq"],
                                  priority=page["priority"]))

    # VS / comparison pages
    for slug in _VS_SLUGS:
        entries.append(_url_entry(base_url, f"/linki-vs/{slug}",
                                  lastmod=today,
                                  changefreq="monthly",
                                  priority="0.7"))

    # Blog posts
    result = await db.execute(
        select(BlogPost)
        .where(BlogPost.published.is_(True))
        .order_by(BlogPost.published_at.desc())
    )
    posts = result.scalars().all()
    for post in posts:
        lastmod = post.published_at.date().isoformat() if post.published_at else today
        entries.append(_url_entry(base_url, f"/blog/{post.slug}",
                                  lastmod=lastmod,
                                  changefreq="monthly",
                                  priority="0.8"))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )
    return Response(content=xml, media_type="application/xml")


# Serve static frontend files if they exist (production build)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Serve static assets (JS, CSS, etc.)
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    # Catch-all route for SPA - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for any non-API routes."""
        # Check if it's a file in static directory (with path traversal protection)
        file_path = (static_dir / full_path).resolve()
        if file_path.is_file() and str(file_path).startswith(str(static_dir.resolve())):
            return FileResponse(file_path)
        # Otherwise serve index.html for SPA routing
        return FileResponse(static_dir / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
