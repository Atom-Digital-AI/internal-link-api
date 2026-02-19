# Blog Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a database-backed public blog to Linki with API-key-protected write endpoints enabling automated publishing from AI agents or scripts.

**Architecture:** Posts stored in Postgres (`blog_posts` table). FastAPI `blog/` router handles CRUD with `X-API-Key` header auth for writes, public reads. React frontend renders two pages: `/blog` (list) and `/blog/:slug` (post), where `html_content` is injected via `dangerouslySetInnerHTML` — intentionally unsanitised to allow JS, animations, and embedded tools.

**Tech Stack:** FastAPI, SQLAlchemy async, Postgres, React + TypeScript, React Router, inline styles

---

## Task 1: SQL Migration

**Files:**
- Create: `migrations/003_add_blog_posts.sql`

**Step 1: Create the migration file**

```sql
-- migrations/003_add_blog_posts.sql
CREATE TABLE IF NOT EXISTS blog_posts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         TEXT UNIQUE NOT NULL,
    title        TEXT NOT NULL,
    excerpt      TEXT,
    html_content TEXT NOT NULL DEFAULT '',
    cover_image  TEXT,
    published    BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (published, published_at DESC);
```

**Step 2: Run the migration against your database**

```bash
psql $DATABASE_URL -f migrations/003_add_blog_posts.sql
```

Expected: `CREATE TABLE` and `CREATE INDEX` output, no errors.

**Step 3: Commit**

```bash
git add migrations/003_add_blog_posts.sql
git commit -m "feat: add blog_posts migration"
```

---

## Task 2: SQLAlchemy Model

**Files:**
- Modify: `db_models.py`

**Step 1: Add the BlogPost model to `db_models.py`**

Add this class at the end of the file (after the `AiUsage` class):

```python
class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    html_content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cover_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published: Mapped[bool] = mapped_column(default=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

The existing imports at the top of `db_models.py` already cover everything needed (`uuid`, `datetime`, `Optional`, `Text`, `DateTime`, `func`, `Mapped`, `mapped_column`).

**Step 2: Verify import — run Python to check no syntax errors**

```bash
python -c "from db_models import BlogPost; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add db_models.py
git commit -m "feat: add BlogPost SQLAlchemy model"
```

---

## Task 3: Blog Backend Router

**Files:**
- Create: `blog/__init__.py`
- Create: `blog/router.py`

**Step 1: Create `blog/__init__.py`**

Empty file:
```python
```

**Step 2: Create `blog/router.py`**

```python
"""Blog router — public reads, API-key-protected writes."""
import os
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models import BlogPost

router = APIRouter(prefix="/blog", tags=["blog"])

BLOG_API_KEY = os.environ.get("BLOG_API_KEY", "")


def _verify_api_key(x_api_key: str = Header(default="")) -> None:
    if not BLOG_API_KEY or x_api_key != BLOG_API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BlogPostSummary(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    published_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogPostDetail(BlogPostSummary):
    html_content: str


class CreateBlogPostRequest(BaseModel):
    slug: str
    title: str
    excerpt: Optional[str] = None
    html_content: str = ""
    cover_image: Optional[str] = None
    published: bool = False


class UpdateBlogPostRequest(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    html_content: Optional[str] = None
    cover_image: Optional[str] = None
    published: Optional[bool] = None


# ---------------------------------------------------------------------------
# GET /blog/posts — list published posts
# ---------------------------------------------------------------------------

@router.get("/posts", response_model=list[BlogPostSummary])
async def list_posts(db: AsyncSession = Depends(get_db)) -> list[BlogPostSummary]:
    result = await db.execute(
        select(BlogPost)
        .where(BlogPost.published.is_(True))
        .order_by(BlogPost.published_at.desc())
    )
    posts = result.scalars().all()
    return [
        BlogPostSummary(
            id=str(p.id),
            slug=p.slug,
            title=p.title,
            excerpt=p.excerpt,
            cover_image=p.cover_image,
            published_at=p.published_at,
            created_at=p.created_at,
        )
        for p in posts
    ]


# ---------------------------------------------------------------------------
# GET /blog/posts/{slug} — single post with html_content
# ---------------------------------------------------------------------------

@router.get("/posts/{slug}", response_model=BlogPostDetail)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)) -> BlogPostDetail:
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug, BlogPost.published.is_(True))
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return BlogPostDetail(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        html_content=post.html_content,
        cover_image=post.cover_image,
        published_at=post.published_at,
        created_at=post.created_at,
    )


# ---------------------------------------------------------------------------
# POST /blog/posts — create post (API key required)
# ---------------------------------------------------------------------------

@router.post(
    "/posts",
    response_model=BlogPostDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_verify_api_key)],
)
async def create_post(
    body: CreateBlogPostRequest,
    db: AsyncSession = Depends(get_db),
) -> BlogPostDetail:
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == body.slug))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="A post with this slug already exists")

    now = datetime.now(timezone.utc)
    post = BlogPost(
        slug=body.slug,
        title=body.title,
        excerpt=body.excerpt,
        html_content=body.html_content,
        cover_image=body.cover_image,
        published=body.published,
        published_at=now if body.published else None,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)

    return BlogPostDetail(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        html_content=post.html_content,
        cover_image=post.cover_image,
        published_at=post.published_at,
        created_at=post.created_at,
    )


# ---------------------------------------------------------------------------
# PATCH /blog/posts/{slug} — update post (API key required)
# ---------------------------------------------------------------------------

@router.patch(
    "/posts/{slug}",
    response_model=BlogPostDetail,
    dependencies=[Depends(_verify_api_key)],
)
async def update_post(
    slug: str,
    body: UpdateBlogPostRequest,
    db: AsyncSession = Depends(get_db),
) -> BlogPostDetail:
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if body.title is not None:
        post.title = body.title
    if body.excerpt is not None:
        post.excerpt = body.excerpt
    if body.html_content is not None:
        post.html_content = body.html_content
    if body.cover_image is not None:
        post.cover_image = body.cover_image
    if body.published is not None:
        was_published = post.published
        post.published = body.published
        if body.published and not was_published:
            post.published_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(post)

    return BlogPostDetail(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        html_content=post.html_content,
        cover_image=post.cover_image,
        published_at=post.published_at,
        created_at=post.created_at,
    )


# ---------------------------------------------------------------------------
# DELETE /blog/posts/{slug} — delete post (API key required)
# ---------------------------------------------------------------------------

@router.delete(
    "/posts/{slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(_verify_api_key)],
)
async def delete_post(slug: str, db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
```

**Step 3: Verify no syntax errors**

```bash
python -c "from blog.router import router; print('OK')"
```

Expected: `OK`

**Step 4: Commit**

```bash
git add blog/__init__.py blog/router.py
git commit -m "feat: add blog router with CRUD endpoints"
```

---

## Task 4: Register Blog Router in main.py

**Files:**
- Modify: `main.py`

**Step 1: Add the import after the other router imports**

Find this block in `main.py` (around line 30–37):
```python
from internal.router import router as internal_router
```

Add this line immediately after:
```python
from blog.router import router as blog_router
```

**Step 2: Register the router**

Find this block (around line 89–95):
```python
app.include_router(internal_router)
```

Add this line immediately after:
```python
app.include_router(blog_router)
```

**Step 3: Test the API starts and endpoints appear**

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — you should see a "blog" section with 5 endpoints.

**Step 4: Smoke-test with curl**

Set a test API key first:
```bash
export BLOG_API_KEY=test-secret-123
```

Create a post:
```bash
curl -s -X POST http://localhost:8000/blog/posts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-secret-123" \
  -d '{
    "slug": "test-post",
    "title": "Test Post",
    "excerpt": "A test excerpt",
    "html_content": "<h1>Hello</h1><p>World</p>",
    "published": true
  }' | python -m json.tool
```

Expected: JSON response with the created post including an `id` field.

List posts:
```bash
curl -s http://localhost:8000/blog/posts | python -m json.tool
```

Expected: JSON array containing the test post.

Get single post:
```bash
curl -s http://localhost:8000/blog/posts/test-post | python -m json.tool
```

Expected: JSON with `html_content` field.

Test auth guard (should return 403):
```bash
curl -s -X POST http://localhost:8000/blog/posts \
  -H "Content-Type: application/json" \
  -d '{"slug":"x","title":"x","html_content":"x"}' | python -m json.tool
```

Expected: `{"detail": "Forbidden"}`

**Step 5: Commit**

```bash
git add main.py
git commit -m "feat: register blog router in main.py"
```

---

## Task 5: Frontend — Blog API Service Functions

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: Add blog types and functions to the end of `api.ts`**

```typescript
// ─── Blog types ────────────────────────────────────────────────────────────

export interface BlogPostSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  created_at: string
}

export interface BlogPostDetail extends BlogPostSummary {
  html_content: string
}

// ─── Blog API calls ─────────────────────────────────────────────────────────

export async function fetchBlogPosts(): Promise<BlogPostSummary[]> {
  return fetchJson<BlogPostSummary[]>(`${API_BASE}/blog/posts`)
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  return fetchJson<BlogPostDetail>(`${API_BASE}/blog/posts/${slug}`)
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add blog API service functions"
```

---

## Task 6: Frontend — Blog List Page

**Files:**
- Create: `frontend/src/pages/BlogList.tsx`

**Step 1: Create `frontend/src/pages/BlogList.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { fetchBlogPosts, type BlogPostSummary } from '../services/api'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlogPosts()
      .then(setPosts)
      .catch(() => setError('Failed to load posts.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#F5F5F7', minHeight: '100vh' }}>
      <MarketingNav />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#1D1D1F',
          marginBottom: '48px',
        }}>
          Blog
        </h1>

        {loading && (
          <p style={{ color: '#6E6E73' }}>Loading...</p>
        )}

        {error && (
          <p style={{ color: '#FF3B30' }}>{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p style={{ color: '#6E6E73' }}>No posts yet — check back soon.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <article style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                display: 'flex',
                transition: 'box-shadow 0.2s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt=""
                    style={{ width: '200px', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ padding: '28px 32px' }}>
                  {post.published_at && (
                    <p style={{ fontSize: '0.8125rem', color: '#6E6E73', margin: '0 0 8px' }}>
                      {formatDate(post.published_at)}
                    </p>
                  )}
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1D1D1F',
                    margin: '0 0 10px',
                    letterSpacing: '-0.02em',
                  }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p style={{ fontSize: '0.9375rem', color: '#6E6E73', margin: '0 0 16px', lineHeight: 1.6 }}>
                      {post.excerpt}
                    </p>
                  )}
                  <span style={{ fontSize: '0.875rem', color: '#0071E3', fontWeight: 500 }}>
                    Read more →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
```

**Step 2: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/pages/BlogList.tsx
git commit -m "feat: add BlogList page"
```

---

## Task 7: Frontend — Blog Post Page

**Files:**
- Create: `frontend/src/pages/BlogPost.tsx`

**Step 1: Create `frontend/src/pages/BlogPost.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { fetchBlogPost, type BlogPostDetail } from '../services/api'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchBlogPost(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (!loading && notFound) {
    return <Navigate to="/blog" replace />
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#FFFFFF', minHeight: '100vh' }}>
      <MarketingNav />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <Link
          to="/blog"
          style={{ fontSize: '0.875rem', color: '#0071E3', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}
        >
          ← Back to Blog
        </Link>

        {loading && <p style={{ color: '#6E6E73' }}>Loading...</p>}

        {post && (
          <>
            {post.published_at && (
              <p style={{ fontSize: '0.875rem', color: '#6E6E73', margin: '0 0 12px' }}>
                {formatDate(post.published_at)}
              </p>
            )}

            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#1D1D1F',
              margin: '0 0 32px',
              lineHeight: 1.15,
            }}>
              {post.title}
            </h1>

            {post.cover_image && (
              <img
                src={post.cover_image}
                alt=""
                style={{
                  width: '100%',
                  borderRadius: '16px',
                  marginBottom: '40px',
                  display: 'block',
                  objectFit: 'cover',
                  maxHeight: '400px',
                }}
              />
            )}

            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.html_content }}
            />
          </>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
```

**Step 2: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/pages/BlogPost.tsx
git commit -m "feat: add BlogPost page"
```

---

## Task 8: Blog Content CSS

**Files:**
- Modify: `frontend/src/App.css`

**Step 1: Append `.blog-content` scoped styles to the end of `App.css`**

```css
/* ==========================================================================
   BLOG CONTENT — scoped styles for HTML injected via dangerouslySetInnerHTML
   ========================================================================== */

.blog-content {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: #1D1D1F;
}

.blog-content h1,
.blog-content h2,
.blog-content h3,
.blog-content h4 {
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1D1D1F;
  margin: 2em 0 0.5em;
  line-height: 1.2;
}

.blog-content h1 { font-size: 2rem; }
.blog-content h2 { font-size: 1.5rem; }
.blog-content h3 { font-size: 1.25rem; }
.blog-content h4 { font-size: 1.0625rem; }

.blog-content p {
  margin: 0 0 1.25em;
}

.blog-content a {
  color: #0071E3;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-content img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 1.5em 0;
  display: block;
}

.blog-content ul,
.blog-content ol {
  padding-left: 1.5em;
  margin: 0 0 1.25em;
}

.blog-content li {
  margin-bottom: 0.4em;
}

.blog-content blockquote {
  border-left: 3px solid #0071E3;
  margin: 1.5em 0;
  padding: 0.5em 0 0.5em 1.25em;
  color: #6E6E73;
  font-style: italic;
}

.blog-content pre {
  background: #F5F5F7;
  border-radius: 12px;
  padding: 1.25em;
  overflow-x: auto;
  margin: 1.5em 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.blog-content code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.875em;
  background: #F5F5F7;
  padding: 0.15em 0.35em;
  border-radius: 4px;
}

.blog-content pre code {
  background: none;
  padding: 0;
  font-size: inherit;
}

.blog-content hr {
  border: none;
  border-top: 1px solid rgba(0,0,0,0.08);
  margin: 2.5em 0;
}

.blog-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9375rem;
}

.blog-content th,
.blog-content td {
  border: 1px solid rgba(0,0,0,0.08);
  padding: 10px 14px;
  text-align: left;
}

.blog-content th {
  background: #F5F5F7;
  font-weight: 600;
}
```

**Step 2: Commit**

```bash
git add frontend/src/App.css
git commit -m "feat: add .blog-content scoped CSS styles"
```

---

## Task 9: Wire Up Routes, Nav, and Footer

**Files:**
- Modify: `frontend/src/router.tsx`
- Modify: `frontend/src/components/MarketingNav.tsx`
- Modify: `frontend/src/components/MarketingFooter.tsx`

**Step 1: Add routes to `router.tsx`**

Add these two imports after the existing page imports (around line 15):
```typescript
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'
```

Add these two routes inside `<Routes>`, after the `/terms` route:
```tsx
<Route path="/blog" element={<BlogList />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

**Step 2: Add Blog link to `MarketingNav.tsx`**

Find the nav links section — the `<nav>` with Features and Pricing links (around line 63–95). Add a Blog link between Features and Pricing:

```tsx
<Link
  to="/blog"
  style={{
    color: "#1D1D1F",
    fontSize: "0.9375rem",
    fontWeight: 500,
    textDecoration: "none",
  }}
>
  Blog
</Link>
```

**Step 3: Add Blog link to `MarketingFooter.tsx`**

Find the links array (around line 24):
```tsx
{ to: '/privacy', label: 'Privacy' },
{ to: '/terms', label: 'Terms' },
{ to: '/pricing', label: 'Pricing' },
{ to: '/login', label: 'Sign in' },
```

Add `{ to: '/blog', label: 'Blog' },` before `{ to: '/login', label: 'Sign in' }`.

**Step 4: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

**Step 5: Manual browser test**

```bash
# Terminal 1 — backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173/blog` — should show "No posts yet" message.

Create a post via curl:
```bash
curl -s -X POST http://localhost:8000/blog/posts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-secret-123" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World",
    "excerpt": "Our first blog post.",
    "html_content": "<p>Welcome to the <strong>Linki</strong> blog!</p><h2>Why internal linking matters</h2><p>Internal links help search engines discover and understand your content.</p>",
    "published": true
  }'
```

Refresh `http://localhost:5173/blog` — post card should appear.
Click the card — should navigate to `/blog/hello-world` and render the HTML content.
Check `MarketingNav` has a Blog link. Check footer has a Blog link.

**Step 6: Commit**

```bash
git add frontend/src/router.tsx frontend/src/components/MarketingNav.tsx frontend/src/components/MarketingFooter.tsx
git commit -m "feat: wire up blog routes, nav, and footer links"
```

---

## Task 10: Add BLOG_API_KEY to .env.example

**Files:**
- Modify: `.env.example`

**Step 1: Add the new env var**

Open `.env.example` and add:
```
BLOG_API_KEY=your-secret-api-key-here
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: document BLOG_API_KEY env var"
```

---

## Done

The blog is fully functional. Summary of what was built:

- `migrations/003_add_blog_posts.sql` — Postgres table
- `db_models.py` — `BlogPost` SQLAlchemy model
- `blog/router.py` — 5 REST endpoints, API key auth on writes
- `main.py` — blog router registered
- `frontend/src/services/api.ts` — `fetchBlogPosts` / `fetchBlogPost`
- `frontend/src/pages/BlogList.tsx` — `/blog` listing page
- `frontend/src/pages/BlogPost.tsx` — `/blog/:slug` post page
- `frontend/src/App.css` — `.blog-content` scoped typography
- `frontend/src/router.tsx` — routes added
- `MarketingNav.tsx` / `MarketingFooter.tsx` — Blog links added

To publish a post from any tool (Make.com, n8n, AI agent), `POST /blog/posts` with `X-API-Key: <BLOG_API_KEY>` header and a JSON body containing the full HTML.
