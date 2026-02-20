import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { RichText } from '@payloadcms/richtext-lexical/react'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { getGlobal } from '../services/cms'

interface TermsData {
  body: unknown
  metaTitle: string
  metaDescription: string
}

export default function Terms() {
  const [content, setContent] = useState<TermsData | null>(null)

  useEffect(() => {
    getGlobal<TermsData>('page-terms')
      .then(setContent)
      .catch(console.error)
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#FFFFFF' }}>
      <Helmet>
        <title>{content?.metaTitle || 'Terms of Service — Linki'}</title>
        <meta name="description" content={content?.metaDescription || 'Read the terms and conditions for using Linki, the AI-powered internal linking tool.'} />
        <link rel="canonical" href="https://getlinki.app/terms" />
        <meta property="og:title" content={content?.metaTitle || 'Terms of Service — Linki'} />
        <meta property="og:description" content={content?.metaDescription || 'Read the terms and conditions for using Linki, the AI-powered internal linking tool.'} />
        <meta property="og:url" content="https://getlinki.app/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content?.metaTitle || 'Terms of Service — Linki'} />
        <meta name="twitter:description" content={content?.metaDescription || 'Read the terms and conditions for using Linki, the AI-powered internal linking tool.'} />
      </Helmet>
      <MarketingNav />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#1D1D1F', margin: '0 0 8px' }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: '#6E6E73', fontSize: '0.875rem', marginBottom: '48px' }}>
          Last updated: February 2026
        </p>

        <hr style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '32px 0' }} />

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {!!content?.body && <RichText data={content.body as any} />}
      </div>
      <MarketingFooter />
    </div>
  )
}
