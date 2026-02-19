# Blog Feature Design

**Date:** 2026-02-19
**Status:** Approved

## Overview

Add a public blog to Linki. Posts are stored in Postgres and managed via an API-key-protected REST API, enabling automated publishing (AI agents, Make.com, scripts). The frontend renders full HTML content so posts can contain images, JavaScript, animations, and embedded tools.

## Architecture

### Backend

- New `blog/` router (`blog/router.py`) following the existing router pattern
- `BlogPost` SQLAlchemy model added to `db_models.py`
- SQL migration `migrations/003_add_blog_posts.sql`
- Write endpoints protected by `BLOG_API_KEY` env var (simple `X-API-Key` header check)
- Read endpoints are fully public (no auth)

### Frontend

- Two new public pages: `/blog` (list) and `/blog/:slug` (post)
- Both use `MarketingNav` and `MarketingFooter`
- Post page renders `html_content` via `dangerouslySetInnerHTML` inside a scoped `div.blog-content`
- Blog list page shows cards: cover image, title, excerpt, date
- `MarketingNav` and `MarketingFooter` get a "Blog" link added
- Routes added to `router.tsx`

## Database Schema

```sql
CREATE TABLE blog_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  html_content TEXT NOT NULL,
  cover_image  TEXT,
  published    BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

## API Endpoints

| Method   | Path                  | Auth    | Purpose                              |
|----------|-----------------------|---------|--------------------------------------|
| GET      | `/blog/posts`         | none    | List published posts (no html_content) |
| GET      | `/blog/posts/:slug`   | none    | Fetch single post with html_content  |
| POST     | `/blog/posts`         | API key | Create post                          |
| PATCH    | `/blog/posts/:slug`   | API key | Update post (partial)                |
| DELETE   | `/blog/posts/:slug`   | API key | Delete post                          |

### POST /blog/posts body

```json
{
  "slug": "how-to-fix-internal-links",
  "title": "How to Fix Internal Linking Issues",
  "excerpt": "A short summary for the listing page.",
  "html_content": "<h1>...</h1><p>Full HTML here, including scripts and animations</p>",
  "cover_image": "https://example.com/image.jpg",
  "published": true
}
```

## Frontend Pages

### /blog (BlogList)

- Grid of post cards matching Linki light theme (#F5F5F7 background, white cards)
- Each card: cover image, title, excerpt, formatted date, "Read more" link
- Empty state if no posts published

### /blog/:slug (BlogPost)

- Full-width cover image (if present)
- Title + published date
- `html_content` rendered in `<div className="blog-content">` with scoped CSS
- Scoped blog CSS covers: headings, paragraphs, images (max-width 100%), code blocks, blockquotes
- Back link to `/blog`

## Nav / Footer Changes

- `MarketingNav`: add "Blog" link between Features and Pricing
- `MarketingFooter`: add `{ to: '/blog', label: 'Blog' }` to links array

## Security

- `BLOG_API_KEY` env var required for all write operations
- Read endpoints are public
- `html_content` is rendered unsanitised — this is intentional (admin-only writes via API key, enabling full JS/animations)

## Files to Create/Modify

### New files
- `blog/router.py`
- `blog/__init__.py`
- `migrations/003_add_blog_posts.sql`
- `frontend/src/pages/BlogList.tsx`
- `frontend/src/pages/BlogPost.tsx`

### Modified files
- `db_models.py` — add `BlogPost` model
- `main.py` — include blog router
- `frontend/src/router.tsx` — add `/blog` and `/blog/:slug` routes
- `frontend/src/components/MarketingNav.tsx` — add Blog link
- `frontend/src/components/MarketingFooter.tsx` — add Blog link
- `frontend/src/App.css` — add `.blog-content` scoped styles
