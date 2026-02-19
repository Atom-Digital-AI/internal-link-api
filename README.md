# Internal Link Finder

A full-stack application for analyzing internal links on websites. Includes a FastAPI backend for page analysis and a React frontend with AI-powered link suggestions.

## Quick Start

```bash
# Build and run full stack with Docker
docker compose up --build

# API available at http://localhost:8000
# Frontend available at http://localhost:5173
# API docs at http://localhost:8000/docs
```

## Project Structure

```
internal-link-api/
├── main.py              # FastAPI app + routes
├── scraper.py           # URL fetching + parsing logic
├── sitemap_parser.py    # Sitemap fetching + parsing
├── models.py            # Pydantic models
├── requirements.txt     # Python dependencies
├── Dockerfile           # API container build
├── docker-compose.yml   # Local development
└── frontend/            # React SPA
    ├── src/
    │   ├── App.tsx      # Main component
    │   ├── types.ts     # TypeScript types
    │   └── services/
    │       ├── api.ts   # Backend API client
    │       └── gemini.ts # AI integration
    ├── Dockerfile       # Production build
    └── Dockerfile.dev   # Development with hot reload
```

## Environment Variables

### Backend (API)
| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_BULK_URLS` | 100 | Maximum URLs allowed in bulk-analyze |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:8000 | Backend API URL |
| `VITE_GEMINI_API_KEY` | (required) | Gemini API key for AI suggestions |
| `VITE_GEMINI_MODEL` | gemini-1.5-flash | Gemini model to use |

For local development, create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your-api-key-here
VITE_GEMINI_MODEL=gemini-1.5-flash
```

## API Endpoints

### GET /health
Health check for deployment monitoring.

```bash
curl http://localhost:8000/health
# {"status":"ok","version":"1.0.0"}
```

### GET /config
Get API configuration (max bulk URLs limit).

```bash
curl http://localhost:8000/config
# {"max_bulk_urls":100}
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
# Run full stack with hot reload
docker compose up --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after changes
docker compose up --build
```

### Frontend Only (without Docker)
```bash
cd frontend
npm install
npm run dev
```

## Railway Deployment

The Dockerfile builds both frontend and API into a single container. Railway auto-detects it.

1. Create new project in Railway
2. Connect GitHub repo
3. Set **build arguments** in Railway (Settings → Build → Build Arguments):
   - `VITE_GEMINI_API_KEY` = your Gemini API key
   - `VITE_GEMINI_MODEL` = `gemini-1.5-flash` (optional)
4. Deploy - Railway builds and serves everything from one service
5. Set custom domain if needed

The API serves both:
- API endpoints at `/health`, `/config`, `/sitemap`, `/analyze`, `/bulk-analyze`
- Frontend at `/` (root) and all other paths

## CORS

API configured for:
- `http://localhost:*`
- `https://*.web.app`
- `https://*.firebaseapp.com`

## Features

- **Sitemap Parsing**: Fetches and parses XML sitemaps (including gzipped)
- **Link Analysis**: Counts internal/external links, calculates link density
- **Bulk Processing**: Analyze multiple pages with rate limiting
- **AI Suggestions**: AI-powered recommendations for internal linking opportunities
- **Cost Protection**: Configurable URL limits to prevent excessive API usage
