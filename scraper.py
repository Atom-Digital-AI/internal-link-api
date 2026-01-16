import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import trafilatura
from models import LinkInfo, InternalLinksInfo, AnalyzeResponse, PageResult

USER_AGENT = "InternalLinkFinder/1.0 (SEO Analysis Tool)"
PAGE_TIMEOUT = 10.0


async def analyze_page(url: str, target_pattern: str) -> AnalyzeResponse:
    """
    Scrape a single URL and return link audit data.
    """
    url_str = str(url)
    parsed_url = urlparse(url_str)
    base_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"

    try:
        async with httpx.AsyncClient(
            timeout=PAGE_TIMEOUT,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
        ) as client:
            response = await client.get(url_str)
            response.raise_for_status()
            html = response.text
    except httpx.TimeoutException:
        return AnalyzeResponse(
            url=url_str,
            internal_links=InternalLinksInfo(total=0, to_target_pages=0, links=[]),
            error="timeout",
        )
    except httpx.HTTPStatusError as e:
        return AnalyzeResponse(
            url=url_str,
            internal_links=InternalLinksInfo(total=0, to_target_pages=0, links=[]),
            error=f"http_{e.response.status_code}",
        )
    except httpx.RequestError as e:
        return AnalyzeResponse(
            url=url_str,
            internal_links=InternalLinksInfo(total=0, to_target_pages=0, links=[]),
            error=f"request_error: {str(e)}",
        )

    # Parse HTML
    soup = BeautifulSoup(html, "lxml")

    # Extract title
    title = None
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)
    if not title:
        h1_tag = soup.find("h1")
        if h1_tag:
            title = h1_tag.get_text(strip=True)

    # Extract main content using Trafilatura with HTML output to preserve links
    # This ensures we only count links within the actual article content
    content_html = trafilatura.extract(
        html,
        output_format='html',
        include_links=True,
        include_images=False,
        include_tables=True,
    ) or ""

    # Also get plain text version for word count
    extracted_content = trafilatura.extract(
        html,
        output_format='markdown',
        include_links=False,
        include_images=False,
        include_tables=True,
    ) or ""

    if not extracted_content:
        # Fallback to BeautifulSoup text extraction
        body = soup.find("body")
        if body:
            # Remove script and style elements
            for element in body(["script", "style", "nav", "footer", "header"]):
                element.decompose()
            extracted_content = body.get_text(separator="\n\n", strip=True)
            content_html = str(body)

    # Count words
    word_count = len(extracted_content.split()) if extracted_content else 0

    # Find all links within the extracted main content only
    internal_links: list[LinkInfo] = []
    external_link_count = 0

    # Parse the extracted content HTML to find links
    content_soup = BeautifulSoup(content_html, "lxml") if content_html else None

    for a_tag in (content_soup.find_all("a", href=True) if content_soup else []):
        href = a_tag.get("href", "")

        # Skip empty, anchor-only, and javascript hrefs
        if not href or href.startswith("#") or href.startswith("javascript:"):
            continue

        # Normalize URL
        absolute_url = urljoin(url_str, href)
        parsed_href = urlparse(absolute_url)

        # Get anchor text
        anchor_text = a_tag.get_text(strip=True)

        # Determine if internal or external
        if parsed_href.netloc == parsed_url.netloc:
            # Internal link
            is_target = target_pattern.lower() in absolute_url.lower()
            internal_links.append(
                LinkInfo(href=absolute_url, anchor_text=anchor_text, is_target=is_target)
            )
        else:
            external_link_count += 1

    # Count target links
    target_link_count = sum(1 for link in internal_links if link.is_target)

    # Calculate link density (words per internal link)
    # Use 0.0 when no internal links (JSON doesn't support infinity)
    link_density = word_count / len(internal_links) if internal_links else 0.0

    # Create content snippet
    content_snippet = extracted_content[:500] if extracted_content else ""

    return AnalyzeResponse(
        url=url_str,
        title=title,
        word_count=word_count,
        internal_links=InternalLinksInfo(
            total=len(internal_links),
            to_target_pages=target_link_count,
            links=internal_links,
        ),
        external_links=external_link_count,
        link_density=round(link_density, 2),
        content_snippet=content_snippet,
        extracted_content=extracted_content,
    )


async def analyze_page_summary(
    url: str, target_pattern: str, link_ratio_threshold: int
) -> PageResult:
    """
    Analyze a page and return a summary result for bulk operations.
    """
    result = await analyze_page(url, target_pattern)

    if result.error:
        return PageResult(
            url=result.url,
            status="failed",
            error=result.error,
        )

    # Determine status
    needs_links = (
        result.link_density > link_ratio_threshold
        or result.internal_links.to_target_pages == 0
    )

    status = "needs_links" if needs_links else "good"

    return PageResult(
        url=result.url,
        title=result.title,
        word_count=result.word_count,
        internal_link_count=result.internal_links.total,
        target_link_count=result.internal_links.to_target_pages,
        link_density=result.link_density,
        status=status,
    )
