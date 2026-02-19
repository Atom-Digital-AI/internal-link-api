import { Link } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'

const features = [
  {
    category: 'SCANNING',
    h2: 'Bulk URL scanning',
    desc: 'Crawl your sitemap and analyse up to 10 pages on the free plan or 500 pages on Pro. Linki discovers every existing internal link and maps your site\'s link structure automatically.',
    emoji: '🕷️',
  },
  {
    category: 'AI-POWERED',
    h2: 'AI-powered suggestions',
    desc: 'Linki reads the context of each page and recommends the perfect anchor text to add, plus exactly which target page to link to.',
    emoji: '✨',
  },
  {
    category: 'PRO FEATURE',
    h2: 'Cloud sessions',
    desc: 'Save your analysis sessions to the cloud. Come back tomorrow, next week, or next month — your crawl results and suggestions are waiting for you.',
    emoji: '☁️',
  },
  {
    category: 'PRO FEATURE',
    h2: 'Saved link opportunities',
    desc: 'Bookmark individual link suggestions across sessions. Build a queue of improvements to work through at your own pace without losing anything.',
    emoji: '🔖',
  },
  {
    category: 'INSIGHTS',
    h2: 'Link health tracking',
    desc: 'See at a glance which pages have too few internal links pointing to them. Spot your most under-linked content and prioritise accordingly.',
    emoji: '📊',
  },
  {
    category: 'EXPORT',
    h2: 'Export & integrate',
    desc: 'Download all your link opportunities as a CSV file. Drop them into your CMS workflow, share with your team, or import into your project management tool.',
    emoji: '⬇️',
  },
]

export default function Features() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
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
          Everything you need for smarter internal linking
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
          Linki combines intelligent crawling with AI to take the guesswork out of internal linking.
        </p>
      </section>

      {/* Features list */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        {features.map((feature, index) => {
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
