import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { RichText } from '@payloadcms/richtext-lexical/react'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { getGlobal } from '../services/cms'

interface PrivacyData {
  body: unknown
  metaTitle: string
  metaDescription: string
}

export default function Privacy() {
  const [content, setContent] = useState<PrivacyData | null>(null)

  useEffect(() => {
    getGlobal<PrivacyData>('page-privacy')
      .then(setContent)
      .catch(console.error)
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#FFFFFF' }}>
      <Helmet>
        <title>{content?.metaTitle || 'Privacy Policy — Linki'}</title>
        <meta name="description" content={content?.metaDescription || 'Learn how Linki collects, uses, and protects your personal data. We are committed to transparency and GDPR compliance.'} />
        <link rel="canonical" href="https://getlinki.app/privacy" />
        <meta property="og:title" content={content?.metaTitle || 'Privacy Policy — Linki'} />
        <meta property="og:description" content={content?.metaDescription || 'Learn how Linki collects, uses, and protects your personal data. We are committed to transparency and GDPR compliance.'} />
        <meta property="og:url" content="https://getlinki.app/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content?.metaTitle || 'Privacy Policy — Linki'} />
        <meta name="twitter:description" content={content?.metaDescription || 'Learn how Linki collects, uses, and protects your personal data. We are committed to transparency and GDPR compliance.'} />
      </Helmet>
      <MarketingNav />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#1D1D1F', margin: '0 0 8px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#6E6E73', fontSize: '0.875rem', marginBottom: '48px' }}>
          Last updated: February 2026
        </p>

        <hr style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '32px 0' }} />

        {content?.body && <RichText data={content.body} />}
      </div>
      <MarketingFooter />
    </div>
  )
}
