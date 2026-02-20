import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'

const features = [
  {
    icon: '🕷️',
    title: 'Crawl & Analyse',
    desc: 'Scan up to 500 pages, extract all existing links and discover opportunities',
  },
  {
    icon: '✨',
    title: 'AI Suggestions',
    desc: 'AI-powered suggestions tell you exactly which words to link and where to point them',
  },
  {
    icon: '🔖',
    title: 'Save Sessions',
    desc: 'Pro users can save analysis sessions to revisit and continue later',
  },
  {
    icon: '⬇️',
    title: 'Export Results',
    desc: 'Download your link opportunities as CSV for use in any workflow',
  },
]

const steps = [
  {
    num: '1',
    title: 'Enter your domain',
    desc: 'Type in your website URL and let Linki crawl your pages',
  },
  {
    num: '2',
    title: 'Select pages to analyse',
    desc: 'Choose which pages you want to find linking opportunities for',
  },
  {
    num: '3',
    title: 'Get AI suggestions',
    desc: 'Receive precise anchor text and target page recommendations',
  },
]

const pricingFeatures = [
  { freeLabel: '10 URLs per scan',     proLabel: '500 URLs per scan',          free: true  },
  { freeLabel: 'Basic link analysis',  proLabel: 'AI-powered suggestions',     free: true  },
  { freeLabel: 'Saved sessions',       proLabel: 'Unlimited saved sessions',   free: false },
  { freeLabel: 'Export results',       proLabel: 'Export results',             free: true  },
  { freeLabel: 'Priority support',     proLabel: 'Priority support',           free: false },
]

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Linki',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://getlinki.app',
  description: 'AI-powered internal linking tool that finds pages needing links and suggests exactly where to add them.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'GBP',
    },
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '4.99',
      priceCurrency: 'GBP',
      billingIncrement: 'P1M',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '14.99',
      priceCurrency: 'GBP',
      billingIncrement: 'P1M',
    },
  ],
}

export default function Home() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#F5F5F7' }}>
      <Helmet>
        <title>Linki - AI-Powered Internal Linking Tool for SEO</title>
        <meta name="description" content="Linki finds pages that need internal links and uses AI to suggest exactly where to add them. Improve your site structure and boost SEO." />
        <link rel="canonical" href="https://getlinki.app/" />
        <meta property="og:title" content="Linki - AI-Powered Internal Linking Tool for SEO" />
        <meta property="og:description" content="Linki finds pages that need internal links and uses AI to suggest exactly where to add them. Improve your site structure and boost SEO." />
        <meta property="og:url" content="https://getlinki.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Linki - AI-Powered Internal Linking Tool for SEO" />
        <meta name="twitter:description" content="Linki finds pages that need internal links and uses AI to suggest exactly where to add them. Improve your site structure and boost SEO." />
        <script type="application/ld+json">{JSON.stringify(softwareApplicationSchema)}</script>
      </Helmet>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          paddingTop: '160px',
          paddingBottom: '48px',
          textAlign: 'center',
          background: `
            radial-gradient(ellipse 80% 55% at 50% -5%, rgba(0,113,227,0.13) 0%, transparent 65%),
            radial-gradient(circle at 12% 65%, rgba(0,113,227,0.07) 0%, transparent 38%),
            radial-gradient(circle at 88% 35%, rgba(80,170,255,0.08) 0%, transparent 38%),
            linear-gradient(180deg, #EEF3F8 0%, #FFFFFF 100%)
          `,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#1D1D1F',
            margin: '0 0 20px',
            lineHeight: 1.1,
          }}
        >
          Internal linking made intelligent
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: '#6E6E73',
            maxWidth: '560px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}
        >
          Linki finds pages that need internal links and uses AI to suggest exactly where to add them.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/register"
            style={{
              background: '#0071E3',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '980px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Get started free
          </Link>
          <a
            href="#features"
            style={{
              color: '#0071E3',
              fontWeight: 500,
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            See how it works ↓
          </a>
        </div>
      </section>

      {/* Features strip */}
      <section id="features" style={{ padding: '80px 40px', background: '#FFFFFF' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1D1D1F',
            marginBottom: '48px',
          }}
        >
          Everything you need for smarter internal linking
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '32px 28px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(0,113,227,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '16px',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  color: '#1D1D1F',
                  margin: '0 0 8px',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6E6E73',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 40px', background: '#F5F5F7' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1D1D1F',
            marginBottom: '48px',
          }}
        >
          How it works
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {steps.map((s) => (
            <div
              key={s.num}
              style={{
                textAlign: 'center',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#0071E3',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 auto 16px',
                }}
              >
                {s.num}
              </div>
              <h3
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  color: '#1D1D1F',
                  margin: '0 0 8px',
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6E6E73',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section
        style={{
          padding: '80px 40px',
          background: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1D1D1F',
            margin: '0 0 12px',
          }}
        >
          Simple, transparent pricing
        </h2>
        <p
          style={{
            color: '#6E6E73',
            marginBottom: '48px',
            fontSize: '1.0625rem',
          }}
        >
          Start free, upgrade when you're ready
        </p>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '700px',
            margin: '0 auto 40px',
          }}
        >
          {/* Free card */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              flex: '1',
              minWidth: '260px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#1D1D1F',
                margin: '0 0 4px',
              }}
            >
              Free
            </p>
            <p
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#1D1D1F',
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              $0/mo
            </p>
            <ul
              style={{
                fontSize: '0.875rem',
                color: '#1D1D1F',
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                margin: '16px 0 24px',
                textAlign: 'left',
              }}
            >
              {pricingFeatures.map((feat) => (
                <li key={feat.freeLabel} style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  color: feat.free ? '#1D1D1F' : '#AEAEB2',
                  textDecoration: feat.free ? 'none' : 'line-through',
                  opacity: feat.free ? 1 : 0.55,
                }}>
                  <span style={{ color: feat.free ? '#6E6E73' : '#AEAEB2', textDecoration: 'none', flexShrink: 0 }}>
                    {feat.free ? '○' : '✕'}
                  </span>
                  {feat.freeLabel}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#F5F5F7',
                color: '#1D1D1F',
                padding: '12px 24px',
                borderRadius: '980px',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
              }}
            >
              Get started
            </Link>
          </div>

          {/* Pro card */}
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #0071E3',
              flex: '1',
              minWidth: '260px',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                background: '#0071E3',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 12px',
                borderRadius: '980px',
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              POPULAR
            </span>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#1D1D1F',
                margin: '0 0 4px',
              }}
            >
              Pro
            </p>
            <p
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#1D1D1F',
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              £14.99/mo
            </p>
            <ul
              style={{
                fontSize: '0.875rem',
                color: '#1D1D1F',
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                margin: '16px 0 24px',
                textAlign: 'left',
              }}
            >
              {pricingFeatures.map((feat) => (
                <li key={feat.proLabel} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#0071E3', flexShrink: 0 }}>✓</span>
                  {feat.proLabel}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#0071E3',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '980px',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
              }}
            >
              Get Pro
            </Link>
          </div>
        </div>
        <Link
          to="/pricing"
          style={{
            display: 'block',
            textAlign: 'center',
            color: '#0071E3',
            fontWeight: 500,
            textDecoration: 'none',
            fontSize: '0.9375rem',
          }}
        >
          See full pricing →
        </Link>
      </section>

      {/* Footer CTA */}
      <section
        style={{
          padding: '80px 40px',
          background: 'linear-gradient(135deg, #0071E3 0%, #0058B2 100%)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
          }}
        >
          Ready to improve your internal linking?
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.0625rem',
            margin: '0 0 32px',
          }}
        >
          Join hundreds of SEOs using Linki to build smarter site structure.
        </p>
        <Link
          to="/register"
          style={{
            background: 'white',
            color: '#0071E3',
            padding: '14px 36px',
            borderRadius: '980px',
            fontWeight: 700,
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
