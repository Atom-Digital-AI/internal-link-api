import httpx
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import trafilatura
from models import LinkInfo, InternalLinksInfo, AnalyzeResponse, PageResult, TargetPageInfo

USER_AGENT = "InternalLinkFinder/1.0 (SEO Analysis Tool)"
PAGE_TIMEOUT = 10.0

STOP_WORDS = frozenset({
    'this', 'that', 'with', 'from', 'your', 'have', 'will', 'what', 'when',
    'where', 'which', 'their', 'there', 'about', 'would', 'could', 'should',
    'been', 'being', 'more', 'most', 'some', 'than', 'then', 'them', 'these',
    'those', 'into', 'over', 'such', 'only', 'other', 'also', 'just', 'very',
    'even', 'much', 'each', 'well', 'back', 'after', 'before',
})


def get_word_stems(text: str) -> set[str]:
    """
    Simple stemming: lowercase, remove common suffixes.
    Returns a set of stemmed words.
    """
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    stems = set()
    for word in words:
        # Simple suffix stripping (basic Porter-like stemming)
        stem = word
        for suffix in ['ing', 'ed', 'es', 's', 'ly', 'tion', 'ment', 'ness', 'able', 'ible']:
            if stem.endswith(suffix) and len(stem) > len(suffix) + 2:
                stem = stem[:-len(suffix)]
                break
        stems.add(stem)
    return stems


def calculate_keyword_relevance(
    content: str,
    keywords: list[str],
    match_type: str = "stemmed"
) -> int:
    """
    Calculate relevance score (0-5) based on keyword occurrences in content.

    Args:
        content: The page content to search
        keywords: List of keywords to look for
        match_type: "exact" for exact match, "stemmed" for stemmed match

    Returns:
        Relevance score from 0-5
    """
    if not keywords or not content:
        return 0

    content_lower = content.lower()
    total_matches = 0

    if match_type == "exact":
        # Exact match - case insensitive
        for keyword in keywords:
            keyword_lower = keyword.lower()
            # Count occurrences
            matches = content_lower.count(keyword_lower)
            total_matches += matches
    else:
        # Stemmed match
        content_stems = get_word_stems(content)
        for keyword in keywords:
            keyword_stems = get_word_stems(keyword)
            # Check if any keyword stem appears in content stems
            for stem in keyword_stems:
                if stem in content_stems:
                    # Count how many times the stem pattern appears
                    pattern = re.compile(rf'\b{re.escape(stem)}\w*\b', re.IGNORECASE)
                    matches = len(pattern.findall(content))
                    total_matches += matches

    # Convert to 0-5 scale
    # 0 matches = 0, 1-2 = 1, 3-5 = 2, 6-10 = 3, 11-20 = 4, 21+ = 5
    if total_matches == 0:
        return 0
    elif total_matches <= 2:
        return 1
    elif total_matches <= 5:
        return 2
    elif total_matches <= 10:
        return 3
    elif total_matches <= 20:
        return 4
    else:
        return 5


async def fetch_target_page_content(url: str) -> TargetPageInfo:
    """
    Fetch a target page and extract its title and key terms for semantic matching.

    Args:
        url: The target page URL

    Returns:
        TargetPageInfo with url, title, and extracted keywords
    """
    url_str = str(url)

    try:
        async with httpx.AsyncClient(
            timeout=PAGE_TIMEOUT,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
        ) as client:
            response = await client.get(url_str)
            response.raise_for_status()
            html = response.text
    except Exception:
        return TargetPageInfo(url=url_str, title=None, keywords=[])

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

    # Extract main content
    extracted_content = trafilatura.extract(
        html,
        output_format='txt',
        include_links=False,
        include_images=False,
        include_tables=True,
    ) or ""

    # Extract keywords from title and content
    keywords = []

    # Add title words (high priority)
    if title:
        title_words = re.findall(r'\b[a-zA-Z]{4,}\b', title.lower())
        keywords.extend([w for w in title_words if w not in STOP_WORDS])

    # Add H1/H2 words from content (medium priority)
    for tag in soup.find_all(['h1', 'h2'], limit=5):
        heading_text = tag.get_text(strip=True)
        heading_words = re.findall(r'\b[a-zA-Z]{4,}\b', heading_text.lower())
        keywords.extend([w for w in heading_words if w not in STOP_WORDS])

    # Deduplicate while preserving order (title words first)
    seen = set()
    unique_keywords = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            unique_keywords.append(kw)

    return TargetPageInfo(
        url=url_str,
        title=title,
        keywords=unique_keywords[:20]  # Limit to top 20 keywords
    )


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

    # Calculate link density as percentage: (links / words) * 100
    link_density = (len(internal_links) / word_count) * 100 if word_count > 0 else 0.0

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
    url: str,
    target_pattern: str,
    filter_keywords: list[str] | None = None,
    filter_match_type: str = "stemmed"
) -> PageResult:
    """
    Analyze a page and return a summary result for bulk operations.

    Args:
        url: The URL to analyze
        target_pattern: Pattern for target pages
        filter_keywords: Optional keywords for relevance scoring
        filter_match_type: "exact" or "stemmed" for keyword matching
    """
    import math

    result = await analyze_page(url, target_pattern)

    if result.error:
        return PageResult(
            url=result.url,
            status="failed",
            error=result.error,
        )

    # Calculate keyword relevance if filter is active
    keyword_relevance = None
    if filter_keywords:
        keyword_relevance = calculate_keyword_relevance(
            result.extracted_content,
            filter_keywords,
            filter_match_type
        )

    # Density thresholds
    LOW_THRESHOLD = 0.35
    HIGH_THRESHOLD = 0.7

    density = result.link_density  # Already (links/words)*100 from analyze_page
    current_links = result.internal_links.total
    word_count = result.word_count

    min_good = math.floor(word_count * 0.0035)
    max_good = math.floor(word_count * 0.007)

    # Determine status and links_available
    if density < LOW_THRESHOLD:
        status = "low"
        add_min = min_good - current_links
        add_max = max_good - current_links
        if add_min < 0:
            add_min = 0
        links_available = f"+{add_min} to +{add_max}"
    elif density > HIGH_THRESHOLD:
        status = "high"
        remove_min = current_links - max_good
        remove_max = current_links - min_good
        if remove_min < 0:
            remove_min = 0
        links_available = f"-{remove_min} to -{remove_max}"
    else:
        status = "good"
        headroom = max_good - current_links
        if headroom > 0:
            links_available = f"0 to +{headroom}"
        else:
            links_available = "0"

    return PageResult(
        url=result.url,
        title=result.title,
        word_count=result.word_count,
        internal_link_count=result.internal_links.total,
        target_link_count=result.internal_links.to_target_pages,
        link_density=result.link_density,
        links_available=links_available,
        status=status,
        keyword_relevance=keyword_relevance,
    )
