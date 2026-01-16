import gzip
import httpx
from bs4 import BeautifulSoup
from models import PageInfo

USER_AGENT = "InternalLinkFinder/1.0 (SEO Analysis Tool)"
SITEMAP_TIMEOUT = 30.0


async def fetch_sitemap(domain: str, source_pattern: str, target_pattern: str) -> dict:
    """
    Fetch and parse a site's sitemap to get all URLs.
    Returns categorized lists of source and target pages.
    """
    domain = domain.rstrip("/")
    sitemap_url = None
    all_urls: list[PageInfo] = []

    async with httpx.AsyncClient(
        timeout=SITEMAP_TIMEOUT,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "gzip, deflate",
        },
        follow_redirects=True,
    ) as client:
        # Try common sitemap locations
        sitemap_locations = [
            f"{domain}/sitemap.xml",
            f"{domain}/sitemap_index.xml",
            f"{domain}/sitemap-index.xml",
            f"{domain}/sitemaps.xml",
        ]

        for url in sitemap_locations:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    # Check if response is XML (either by content-type or if URL ends in .xml)
                    if "xml" in content_type or url.endswith(".xml"):
                        sitemap_url = url
                        xml_content = get_xml_content(response)
                        if xml_content:
                            all_urls = await parse_sitemap(client, xml_content, domain)
                            break
            except httpx.RequestError:
                continue

    # Filter URLs by patterns
    source_pages = [
        page for page in all_urls if source_pattern.lower() in page.url.lower()
    ]
    target_pages = [
        page for page in all_urls if target_pattern.lower() in page.url.lower()
    ]

    return {
        "source_pages": source_pages,
        "target_pages": target_pages,
        "total_found": len(all_urls),
        "sitemap_url": sitemap_url,
    }


def get_xml_content(response: httpx.Response) -> str | None:
    """
    Extract XML content from response, handling gzip compression.
    """
    content_encoding = response.headers.get("content-encoding", "")

    try:
        if "gzip" in content_encoding:
            # Response is gzip encoded - httpx handles this automatically
            return response.text
        else:
            # Check if content starts with gzip magic bytes
            content = response.content
            if content[:2] == b'\x1f\x8b':
                # Manually decompress gzip
                return gzip.decompress(content).decode("utf-8")
            else:
                return response.text
    except Exception:
        return None


async def parse_sitemap(
    client: httpx.AsyncClient, xml_content: str, domain: str
) -> list[PageInfo]:
    """
    Parse sitemap XML content. Handles both regular sitemaps and sitemap indexes.
    """
    soup = BeautifulSoup(xml_content, "lxml-xml")
    urls: list[PageInfo] = []

    # Check if this is a sitemap index
    sitemap_tags = soup.find_all("sitemap")
    if sitemap_tags:
        # This is a sitemap index - recursively fetch child sitemaps
        for sitemap_tag in sitemap_tags:
            loc = sitemap_tag.find("loc")
            if loc and loc.text:
                try:
                    child_response = await client.get(loc.text)
                    if child_response.status_code == 200:
                        child_content = get_xml_content(child_response)
                        if child_content:
                            child_urls = await parse_sitemap(
                                client, child_content, domain
                            )
                            urls.extend(child_urls)
                except httpx.RequestError:
                    continue
    else:
        # Regular sitemap - extract URL entries
        url_tags = soup.find_all("url")
        for url_tag in url_tags:
            loc = url_tag.find("loc")
            if loc and loc.text:
                lastmod_tag = url_tag.find("lastmod")
                lastmod = lastmod_tag.text if lastmod_tag else None
                urls.append(PageInfo(url=loc.text, lastmod=lastmod))

    return urls
