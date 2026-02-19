import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
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
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.html_content, {
                  ADD_TAGS: ['iframe'],
                  ADD_ATTR: ['target', 'rel', 'frameborder', 'allowfullscreen', 'allow', 'loading'],
                })
              }}
            />
          </>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
