import type {
  ConfigResponse,
  SitemapResponse,
  AnalyzeResponse,
  BulkAnalyzeResponse,
  FilterOptions,
  TargetPageInfo,
} from '../types';

// Use relative URLs in production (same origin), absolute URL for local dev
const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getConfig(): Promise<ConfigResponse> {
  return fetchJson<ConfigResponse>(`${API_BASE}/config`);
}

export async function getSitemap(
  domain: string,
  sourcePattern: string,
  targetPattern: string
): Promise<SitemapResponse> {
  return fetchJson<SitemapResponse>(`${API_BASE}/sitemap`, {
    method: 'POST',
    body: JSON.stringify({
      domain,
      source_pattern: sourcePattern,
      target_pattern: targetPattern,
    }),
  });
}

export async function analyzePage(
  url: string,
  targetPattern: string
): Promise<AnalyzeResponse> {
  return fetchJson<AnalyzeResponse>(`${API_BASE}/analyze`, {
    method: 'POST',
    body: JSON.stringify({
      url,
      target_pattern: targetPattern,
    }),
  });
}

export async function bulkAnalyze(
  urls: string[],
  targetPattern: string,
  linkRatioThreshold: number = 500,
  filterOptions?: FilterOptions
): Promise<BulkAnalyzeResponse> {
  return fetchJson<BulkAnalyzeResponse>(`${API_BASE}/bulk-analyze`, {
    method: 'POST',
    body: JSON.stringify({
      urls,
      target_pattern: targetPattern,
      link_ratio_threshold: linkRatioThreshold,
      // Include filter options if provided
      ...(filterOptions?.targetUrl && { filter_target_url: filterOptions.targetUrl }),
      ...(filterOptions?.keyword && { filter_keyword: filterOptions.keyword }),
      ...(filterOptions && { filter_match_type: filterOptions.matchType }),
    }),
  });
}

export async function fetchTargetPage(url: string): Promise<TargetPageInfo> {
  return fetchJson<TargetPageInfo>(`${API_BASE}/fetch-target`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}
