# Internal Link Finder API

A FastAPI backend for analyzing internal links on websites. Designed for SEO analysis workflows.

## Quick Start

```bash
# Build and run with Docker
docker compose up --build

# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## Endpoints

### GET /health
Health check for deployment monitoring.

```bash
curl http://localhost:8000/health
# {"status":"ok","version":"1.0.0"}
```

### POST /sitemap
Fetch and parse a site's sitemap, filtering URLs by pattern.

```bash
curl -X POST http://localhost:8000/sitemap \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "https://example.com",
    "source_pattern": "/blog/",
    "target_pattern": "/services/"
  }'
```

### POST /analyze
Analyze a single URL for internal link data.

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/blog/post",
    "target_pattern": "/services/"
  }'
```

### POST /bulk-analyze
Analyze multiple URLs with 1-second delay between requests.

```bash
curl -X POST http://localhost:8000/bulk-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/blog/post-1", "https://example.com/blog/post-2"],
    "target_pattern": "/services/",
    "link_ratio_threshold": 500
  }'
```

## Local Development

```bash
# Run with hot reload
docker compose up --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Railway Deployment

Railway auto-detects the Dockerfile. Push to GitHub and connect to Railway:

1. Create new project in Railway
2. Connect GitHub repo
3. Railway builds from Dockerfile automatically
4. Set custom domain if needed

## CORS

Configured for:
- `http://localhost:*`
- `https://*.web.app`
- `https://*.firebaseapp.com`
