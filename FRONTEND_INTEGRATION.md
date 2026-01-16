# Internal Link Finder API - Frontend Integration Guide

## Overview

This is a Python FastAPI backend that scrapes websites and analyzes internal links. Your React frontend should call this API to get structured data about pages, then use Gemini to generate recommendations.

**API Base URL (local):** `http://localhost:8000`
**API Base URL (production):** Set after Railway deployment

---

## Endpoints

### 1. GET /config

Get API configuration/limits. Call this on app load to know constraints.

**Response:**
```json
{
  "max_bulk_urls": 100
}
```

**Usage:** Use `max_bulk_urls` to limit URL selection in your UI before calling bulk-analyze.

---

### 2. GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### 3. POST /sitemap

Fetches and parses a website's sitemap, returning URLs filtered by pattern.

**Request:**
```typescript
interface SitemapRequest {
  domain: string;          // e.g., "https://example.com"
  source_pattern: string;  // e.g., "/blog/" - pages to analyze
  target_pattern: string;  // e.g., "/services/" - pages you want linked TO
}
```

**Response:**
```typescript
interface SitemapResponse {
  source_pages: Array<{
    url: string;
    lastmod: string | null;
  }>;
  target_pages: Array<{
    url: string;
    lastmod: string | null;
  }>;
  total_found: number;
  sitemap_url: string | null;
}
```

**Example fetch:**
```typescript
const response = await fetch('http://localhost:8000/sitemap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'https://example.com',
    source_pattern: '/blog/',
    target_pattern: '/services/'
  })
});
const data = await response.json();
// data.source_pages = blog posts to analyze
// data.target_pages = service pages you want to link to
```

---

### 4. POST /analyze

Analyzes a single URL and returns detailed link data + extracted content.

**Request:**
```typescript
interface AnalyzeRequest {
  url: string;            // Full URL to analyze
  target_pattern: string; // Pattern to identify "target" links
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  url: string;
  title: string | null;
  word_count: number;
  internal_links: {
    total: number;
    to_target_pages: number;  // Links matching target_pattern
    links: Array<{
      href: string;
      anchor_text: string;
      is_target: boolean;
    }>;
  };
  external_links: number;
  link_density: number;       // word_count / internal_links.total (0 if no links)
  content_snippet: string;    // First 500 chars
  extracted_content: string;  // Full article text (for Gemini analysis)
  error: string | null;
}
```

**Example fetch:**
```typescript
const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/blog/seo-tips',
    target_pattern: '/services/'
  })
});
const data = await response.json();
// Use data.extracted_content with Gemini for recommendations
```

---

### 5. POST /bulk-analyze

Analyzes multiple URLs with 1-second delay between requests. Returns summary data (not full content).

**Request:**
```typescript
interface BulkAnalyzeRequest {
  urls: string[];              // Array of URLs (max from /config)
  target_pattern: string;
  link_ratio_threshold: number; // Default: 500 (words per link)
}
```

**Response:**
```typescript
interface BulkAnalyzeResponse {
  results: Array<{
    url: string;
    title: string | null;
    word_count: number;
    internal_link_count: number;
    target_link_count: number;
    link_density: number;
    status: 'good' | 'needs_links' | 'failed';
    error: string | null;
  }>;
  summary: {
    total_scanned: number;
    needs_links: number;      // High density OR zero target links
    has_good_density: number;
    failed: number;
  };
}
```

**Status meanings:**
- `good`: Has reasonable link density AND has target links
- `needs_links`: link_density > threshold OR target_link_count === 0
- `failed`: Could not fetch/parse the URL

**Example fetch:**
```typescript
const response = await fetch('http://localhost:8000/bulk-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://example.com/blog/post-1', 'https://example.com/blog/post-2'],
    target_pattern: '/services/',
    link_ratio_threshold: 500
  })
});
const data = await response.json();
// data.results[].status tells you which pages need work
```

---

## Recommended Frontend Workflow

### Step 1: Get sitemap URLs
```typescript
// User enters domain and patterns
const sitemap = await fetchSitemap(domain, sourcePattern, targetPattern);
// Display sitemap.source_pages for user to select which to analyze
```

### Step 2: Bulk analyze selected pages
```typescript
// Check limit first
const config = await fetch('/config').then(r => r.json());
const selectedUrls = userSelectedUrls.slice(0, config.max_bulk_urls);

const bulk = await fetchBulkAnalyze(selectedUrls, targetPattern, 500);
// Show table: URL | Title | Word Count | Links | Status
// Highlight rows where status === 'needs_links'
```

### Step 3: Deep analyze + Gemini recommendations
```typescript
// User clicks a "needs_links" page for detailed analysis
const detailed = await fetchAnalyze(url, targetPattern);

// Send to Gemini for recommendations
const geminiPrompt = `
You are an SEO expert. Analyze this blog post and suggest internal linking opportunities.

**Page Title:** ${detailed.title}
**Word Count:** ${detailed.word_count}
**Current Internal Links:** ${detailed.internal_links.total}
**Links to Target Pages:** ${detailed.internal_links.to_target_pages}

**Target Pages Available to Link To:**
${targetPages.map(p => `- ${p.url}`).join('\n')}

**Article Content:**
${detailed.extracted_content}

Suggest 3-5 specific places in the content where internal links to target pages would be natural and valuable for SEO. For each suggestion:
1. Quote the exact sentence/phrase to add the link
2. Which target page URL to link
3. Suggested anchor text
`;

const recommendations = await callGeminiAPI(geminiPrompt);
```

---

## TypeScript Types (copy to your project)

```typescript
// API Response Types
interface PageInfo {
  url: string;
  lastmod: string | null;
}

interface LinkInfo {
  href: string;
  anchor_text: string;
  is_target: boolean;
}

interface SitemapResponse {
  source_pages: PageInfo[];
  target_pages: PageInfo[];
  total_found: number;
  sitemap_url: string | null;
}

interface AnalyzeResponse {
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

interface PageResult {
  url: string;
  title: string | null;
  word_count: number;
  internal_link_count: number;
  target_link_count: number;
  link_density: number;
  status: 'good' | 'needs_links' | 'failed';
  error: string | null;
}

interface BulkAnalyzeResponse {
  results: PageResult[];
  summary: {
    total_scanned: number;
    needs_links: number;
    has_good_density: number;
    failed: number;
  };
}

interface ConfigResponse {
  max_bulk_urls: number;
}
```

---

## Error Handling

**HTTP 400 - Too many URLs:**
```json
{
  "detail": "Too many URLs. Maximum allowed: 100, received: 150"
}
```

**Individual page errors (in results array):**
```json
{
  "url": "https://example.com/broken",
  "status": "failed",
  "error": "http_404"
}
```

Possible error values:
- `timeout` - Page took >10s to load
- `http_404`, `http_403`, etc. - HTTP errors
- `request_error: ...` - Network/connection errors

---

## CORS

The API allows requests from:
- `http://localhost:3000`, `http://localhost:5173`, `http://localhost:5174`
- `https://*.web.app`
- `https://*.firebaseapp.com`

If you need other origins, update `main.py` CORS config.

---

## Local Development

```bash
# Start the API
cd internal-link-api
docker compose up

# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```
