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
