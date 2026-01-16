from pydantic import BaseModel, HttpUrl
from typing import Optional


# Sitemap models
class SitemapRequest(BaseModel):
    domain: HttpUrl
    source_pattern: str = "/blog/"
    target_pattern: str = "/services/"


class PageInfo(BaseModel):
    url: str
    lastmod: Optional[str] = None


class SitemapResponse(BaseModel):
    source_pages: list[PageInfo]
    target_pages: list[PageInfo]
    total_found: int
    sitemap_url: Optional[str] = None


# Analyze models
class AnalyzeRequest(BaseModel):
    url: HttpUrl
    target_pattern: str = "/services/"


class LinkInfo(BaseModel):
    href: str
    anchor_text: str
    is_target: bool


class InternalLinksInfo(BaseModel):
    total: int
    to_target_pages: int
    links: list[LinkInfo]


class AnalyzeResponse(BaseModel):
    url: str
    title: Optional[str] = None
    word_count: int = 0
    internal_links: InternalLinksInfo
    external_links: int = 0
    link_density: float = 0.0
    content_snippet: str = ""
    extracted_content: str = ""
    error: Optional[str] = None


# Bulk analyze models
class BulkAnalyzeRequest(BaseModel):
    urls: list[HttpUrl]
    target_pattern: str = "/services/"
    link_ratio_threshold: int = 500


class PageResult(BaseModel):
    url: str
    title: Optional[str] = None
    word_count: int = 0
    internal_link_count: int = 0
    target_link_count: int = 0
    link_density: float = 0.0
    status: str = "ok"
    error: Optional[str] = None


class BulkSummary(BaseModel):
    total_scanned: int
    needs_links: int
    has_good_density: int
    failed: int


class BulkAnalyzeResponse(BaseModel):
    results: list[PageResult]
    summary: BulkSummary


# Health check
class HealthResponse(BaseModel):
    status: str
    version: str


# Config
class ConfigResponse(BaseModel):
    max_bulk_urls: int
