from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal


# Sitemap models
class SitemapRequest(BaseModel):
    domain: HttpUrl
    source_pattern: str = "/blog/"
    target_pattern: str = "/services/"


# Filter options for focused search
class FilterOptions(BaseModel):
    target_url: Optional[str] = None  # Specific page to build links to
    keyword: Optional[str] = None  # Keyword to focus on
    match_type: Literal["exact", "stemmed"] = "stemmed"  # Match type for keyword


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
    # Filter options for focused search
    filter_target_url: Optional[str] = None  # Specific page to build links to
    filter_keyword: Optional[str] = None  # Keyword to focus on
    filter_match_type: Literal["exact", "stemmed"] = "stemmed"  # Match type


class PageResult(BaseModel):
    url: str
    title: Optional[str] = None
    word_count: int = 0
    internal_link_count: int = 0
    target_link_count: int = 0
    link_density: float = 0.0
    links_available: str = ""
    status: str = "ok"
    error: Optional[str] = None
    keyword_relevance: Optional[int] = None  # 0-5 relevance score when filter is active


class BulkSummary(BaseModel):
    total_scanned: int
    low_density: int
    good_density: int
    high_density: int
    failed: int


# Target page info for focused search
class FetchTargetRequest(BaseModel):
    url: HttpUrl


class TargetPageInfo(BaseModel):
    url: str
    title: Optional[str] = None
    keywords: list[str] = []  # Extracted keywords from target page content


class BulkAnalyzeResponse(BaseModel):
    results: list[PageResult]
    summary: BulkSummary
    target_page_info: Optional[TargetPageInfo] = None  # Info about the target page when filter is active


# Health check
class HealthResponse(BaseModel):
    status: str
    version: str


# Config
class ConfigResponse(BaseModel):
    max_bulk_urls: int
