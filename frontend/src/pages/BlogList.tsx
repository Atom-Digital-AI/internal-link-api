import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
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
      <Helmet>
        <title>Blog — Linki</title>
        <meta name="description" content="Tips, guides, and articles on internal linking strategy, SEO best practices, and how to improve your site structure with Linki." />
        <link rel="canonical" href="https://getlinki.app/blog" />
        <meta property="og:title" content="Blog — Linki" />
        <meta property="og:description" content="Tips, guides, and articles on internal linking strategy, SEO best practices, and how to improve your site structure with Linki." />
        <meta property="og:url" content="https://getlinki.app/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog — Linki" />
        <meta name="twitter:description" content="Tips, guides, and articles on internal linking strategy, SEO best practices, and how to improve your site structure with Linki." />
      </Helmet>
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
                    alt={post.title}
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
