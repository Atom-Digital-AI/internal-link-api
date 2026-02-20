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
if not BLOG_API_KEY:
    import logging
    logging.getLogger(__name__).warning(
        "BLOG_API_KEY not set — /blog/* write endpoints will reject all requests"
    )


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
