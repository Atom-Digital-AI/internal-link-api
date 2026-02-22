import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getGlobal } from '../services/cms'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'

interface FeaturesData {
  heroHeading: string
  heroSubtext: string
  features: { category: string; h2: string; desc: string; emoji: string }[]
  metaTitle: string
  metaDescription: string
}

export default function Features() {
  const [content, setContent] = useState<FeaturesData | null>(null)

  useEffect(() => {
    getGlobal<FeaturesData>('page-features').then(setContent).catch(() => {})
  }, [])

  if (!content) return null

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <Helmet>
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href="https://getlinki.app/features" />
        <meta property="og:title" content={content.metaTitle} />
        <meta property="og:description" content={content.metaDescription} />
        <meta property="og:url" content="https://getlinki.app/features" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.metaTitle} />
        <meta name="twitter:description" content={content.metaDescription} />
      </Helmet>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          background: '#F5F5F7',
          padding: '120px 40px 64px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#1D1D1F',
            margin: '0 0 16px',
          }}
        >
          {content.heroHeading}
        </h1>
        <p
          style={{
            color: '#6E6E73',
            fontSize: '1.125rem',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          {content.heroSubtext}
        </p>
      </section>

      {/* Features list */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        {content.features.map((feature, index) => {
          const isEven = index % 2 === 1

          return (
            <div
              key={feature.h2}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '64px',
                maxWidth: '1000px',
                margin: '0 auto 80px',
                flexWrap: 'wrap',
                flexDirection: isEven ? 'row-reverse' : 'row',
              }}
            >
              {/* Text block */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#0071E3',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    margin: '0 0 12px',
                  }}
                >
                  {feature.category}
                </p>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1D1D1F',
                    letterSpacing: '-0.03em',
                    margin: '0 0 16px',
                  }}
                >
                  {feature.h2}
                </h2>
                <p
                  style={{
                    fontSize: '1rem',
                    color: '#6E6E73',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {feature.desc}
                </p>
              </div>

              {/* Visual block */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F0F7FF 0%, #E8F0FE 100%)',
                    borderRadius: '16px',
                    height: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                  }}
                >
                  {feature.emoji}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* CTA */}
      <section
        style={{
          background: '#F5F5F7',
          padding: '80px 40px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1D1D1F',
            margin: '0 0 16px',
          }}
        >
          Start finding link opportunities today
        </h2>
        <p
          style={{
            color: '#6E6E73',
            fontSize: '1.0625rem',
            margin: '0 0 32px',
          }}
        >
          Free forever. No credit card required.
        </p>
        <Link
          to="/register"
          style={{
            background: '#0071E3',
            color: 'white',
            padding: '14px 36px',
            borderRadius: '980px',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Get started free
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
