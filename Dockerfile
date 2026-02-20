# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Build args for Vite environment variables
ARG VITE_API_URL=""
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_TURNSTILE_SITE_KEY

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Build the frontend
RUN npm run build

# Stage 2: Python API with frontend static files
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for lxml and Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt-dev \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
RUN crawl4ai-setup

# Copy application code
COPY main.py models.py scraper.py sitemap_parser.py fallback_crawler.py database.py db_models.py email_service.py rate_limit.py embeddings.py ./
COPY auth/ ./auth/
COPY billing/ ./billing/
COPY blog/ ./blog/
COPY internal/ ./internal/
COPY links/ ./links/
COPY sessions/ ./sessions/
COPY ai_router/ ./ai_router/
COPY migrations/ ./migrations/

# Copy built frontend from first stage
COPY --from=frontend-build /frontend/dist ./static

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
