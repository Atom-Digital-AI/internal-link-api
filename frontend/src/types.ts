// API Response Types
export interface PageInfo {
  url: string;
  lastmod: string | null;
}

export interface LinkInfo {
  href: string;
  anchor_text: string;
  is_target: boolean;
}

export interface SitemapResponse {
  source_pages: PageInfo[];
  target_pages: PageInfo[];
  total_found: number;
  sitemap_url: string | null;
}

export interface AnalyzeResponse {
  url: string;
  title: string | null;
  word_count: number;
  internal_links: {
    total: number;
    to_target_pages: number;
    links: LinkInfo[];
  };
  external_links: number;
  link_density: number;
  content_snippet: string;
  extracted_content: string;
  error: string | null;
}

export interface PageResult {
  url: string;
  title: string | null;
  word_count: number;
  internal_link_count: number;
  target_link_count: number;
  link_density: number;
  status: 'good' | 'needs_links' | 'failed';
  error: string | null;
}

export interface BulkAnalyzeResponse {
  results: PageResult[];
  summary: {
    total_scanned: number;
    needs_links: number;
    has_good_density: number;
    failed: number;
  };
}

export interface ConfigResponse {
  max_bulk_urls: number;
}

export interface LinkSuggestion {
  sentence: string;
  targetUrl: string;
  anchorText: string;
  reason: string;
}
