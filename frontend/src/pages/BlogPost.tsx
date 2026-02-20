import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { getCmsBlogPost, type CmsBlogPostDetail } from '../services/cms'
import { RichText } from '@payloadcms/richtext-lexical/react'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<CmsBlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    getCmsBlogPost(slug)
      .then((result) => {
        if (!result) setNotFound(true)
        else setPost(result)
      })
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
            <Helmet>
              <title>{`${post.title} — Linki`}</title>
              <meta name="description" content={post.excerpt || `Read "${post.title}" on the Linki blog.`} />
              <link rel="canonical" href={`https://getlinki.app/blog/${post.slug}`} />
              <meta property="og:title" content={`${post.title} — Linki`} />
              <meta property="og:description" content={post.excerpt || `Read "${post.title}" on the Linki blog.`} />
              <meta property="og:url" content={`https://getlinki.app/blog/${post.slug}`} />
              <meta property="og:type" content="article" />
              <meta property="og:site_name" content="Linki" />
              {post.coverImage?.url && <meta property="og:image" content={post.coverImage?.url} />}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={`${post.title} — Linki`} />
              <meta name="twitter:description" content={post.excerpt || `Read "${post.title}" on the Linki blog.`} />
              <script type="application/ld+json">{JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.title,
                ...(post.excerpt ? { description: post.excerpt } : {}),
                ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
                ...(post.coverImage?.url ? { image: post.coverImage?.url } : {}),
                url: `https://getlinki.app/blog/${post.slug}`,
                author: {
                  '@type': 'Organization',
                  name: 'Linki',
                  url: 'https://getlinki.app',
                },
              })}</script>
            </Helmet>
            {post.publishedAt && (
              <p style={{ fontSize: '0.875rem', color: '#6E6E73', margin: '0 0 12px' }}>
                {formatDate(post.publishedAt)}
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

            {post.coverImage?.url && (
              <img
                src={post.coverImage?.url}
                alt={post.title}
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

            <div className="blog-content">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <RichText data={post.body as any} />
            </div>
          </>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
