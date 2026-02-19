# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build args for Vite environment variables
ARG VITE_API_URL=""
ARG VITE_GEMINI_API_KEY
ARG VITE_GEMINI_MODEL=gemini-1.5-flash
ARG VITE_GOOGLE_CLIENT_ID

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GEMINI_MODEL=$VITE_GEMINI_MODEL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build the frontend
RUN npm run build

# Stage 2: Python API with frontend static files
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for lxml
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py models.py scraper.py sitemap_parser.py database.py db_models.py email_service.py ./
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
