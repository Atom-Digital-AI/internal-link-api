"""Fallback page discovery using crawl4ai when no sitemap is available."""

import asyncio
from urllib.parse import urlparse

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy

from models import PageInfo

CRAWL_TIMEOUT = 60.0


async def crawl_site(domain: str, max_pages: int) -> list[PageInfo]:
    """Discover pages on a domain using BFS crawling.

    Used as a fallback when no sitemap is found. Crawls from the homepage
    following internal links breadth-first.

    Args:
        domain: The base URL to crawl (e.g. "https://example.com").
        max_pages: Maximum number of pages to discover.

    Returns:
        List of PageInfo with discovered URLs (lastmod will be None).
    """
    parsed = urlparse(domain)
    hostname = parsed.hostname or ""

    strategy = BFSDeepCrawlStrategy(
        max_depth=3,
        max_pages=max_pages,
        include_external=False,
    )

    browser_config = BrowserConfig(headless=True)
    run_config = CrawlerRunConfig(
        deep_crawl_strategy=strategy,
        scraping_strategy=LXMLWebScrapingStrategy(),
        verbose=False,
    )

    discovered: list[PageInfo] = []
    seen_urls: set[str] = set()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        results = await asyncio.wait_for(
            crawler.arun(url=domain, config=run_config),
            timeout=CRAWL_TIMEOUT,
        )

        # arun with deep crawl returns a list of results
        if isinstance(results, list):
            for result in results:
                url = result.url
                if url and url not in seen_urls:
                    # Filter to same domain only
                    result_host = urlparse(url).hostname or ""
                    if result_host == hostname:
                        seen_urls.add(url)
                        discovered.append(PageInfo(url=url, lastmod=None))
        elif results and results.url:
            # Single result fallback
            discovered.append(PageInfo(url=results.url, lastmod=None))

    return discovered
