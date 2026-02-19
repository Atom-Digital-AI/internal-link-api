import { Link, useParams } from 'react-router-dom'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { getCompetitor } from '../data/competitors'

function renderValue(val: string | boolean): string {
  if (val === true) return '✓'
  if (val === false) return '✗'
  return val
}

export default function VsPage() {
  const { slug } = useParams<{ slug: string }>()
  const competitor = slug ? getCompetitor(slug) : undefined

  if (!competitor) {
    return (
      <div style={{ fontFamily: 'var(--font-sans)', background: '#F5F5F7', minHeight: '100vh' }}>
        <MarketingNav />
        <div style={{ textAlign: 'center', paddingTop: '160px', paddingBottom: '80px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1D1D1F', marginBottom: '16px' }}>
            Page not found
          </h1>
          <p style={{ color: '#6E6E73', marginBottom: '32px' }}>
            We don't have a comparison page for that tool yet.
          </p>
          <Link
            to="/"
            style={{
              background: '#0071E3',
              color: 'white',
              padding: '12px 28px',
              borderRadius: '980px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            Go home
          </Link>
        </div>
        <MarketingFooter />
      </div>
    )
  }

  const cellBase: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '0.875rem',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    textAlign: 'center',
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#F5F5F7' }}>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          paddingTop: '140px',
          paddingBottom: '64px',
          textAlign: 'center',
          background: `
            radial-gradient(ellipse 80% 55% at 50% -5%, rgba(0,113,227,0.13) 0%, transparent 65%),
            radial-gradient(circle at 12% 65%, rgba(0,113,227,0.07) 0%, transparent 38%),
            radial-gradient(circle at 88% 35%, rgba(80,170,255,0.08) 0%, transparent 38%),
            linear-gradient(180deg, #EEF3F8 0%, #FFFFFF 100%)
          `,
          padding: '140px 24px 64px',
        }}
      >
        <p style={{ color: '#6E6E73', fontSize: '0.8125rem', marginBottom: '12px', letterSpacing: '0.02em' }}>
          Compare →{' '}
          <span style={{ color: '#1D1D1F' }}>Linki vs {competitor.name}</span>
        </p>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#1D1D1F',
            margin: '0 auto 20px',
            lineHeight: 1.1,
            maxWidth: '760px',
          }}
        >
          Linki vs {competitor.name}: {competitor.tagline}
        </h1>
        <p
          style={{
            fontSize: '1.0625rem',
            color: '#6E6E73',
            maxWidth: '580px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}
        >
          {competitor.heroSubhead}
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            Try Linki free →
          </Link>
          <Link
            to="/pricing"
            style={{
              color: '#0071E3',
              padding: '14px 32px',
              borderRadius: '980px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '1.5px solid #0071E3',
              display: 'inline-block',
            }}
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* Quick Verdict */}
      <section style={{ padding: '64px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '28px 32px',
              boxShadow: '0 2px 12px rgba(0,113,227,0.08)',
              border: '1px solid rgba(0,113,227,0.12)',
              borderLeft: '4px solid #0071E3',
            }}
          >
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#0071E3',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
              }}
            >
              The short version
            </p>
            <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: 0 }}>
              {competitor.verdict}
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: '64px 24px', background: '#F5F5F7' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#1D1D1F',
              margin: '0 0 32px',
            }}
          >
            Feature comparison
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
              <thead>
                <tr style={{ background: '#F5F5F7' }}>
                  <th style={{ ...cellBase, textAlign: 'left', fontWeight: 600, color: '#6E6E73', width: '40%' }}>
                    Feature
                  </th>
                  <th style={{ ...cellBase, fontWeight: 700, color: '#0071E3' }}>Linki</th>
                  <th style={{ ...cellBase, fontWeight: 700, color: '#6E6E73' }}>{competitor.name}</th>
                </tr>
              </thead>
              <tbody>
                {competitor.tableRows.map((row, i) => {
                  const linkiVal = renderValue(row.linki)
                  const competitorVal = renderValue(row.competitor)
                  return (
                    <tr key={row.feature} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                      <td style={{ ...cellBase, textAlign: 'left', color: '#1D1D1F', fontWeight: 500 }}>
                        {row.feature}
                      </td>
                      <td
                        style={{
                          ...cellBase,
                          color: row.linki === true ? '#0071E3' : row.linki === false ? '#AEAEB2' : '#1D1D1F',
                          fontWeight: row.linki === true ? 700 : 400,
                        }}
                      >
                        {linkiVal}
                      </td>
                      <td
                        style={{
                          ...cellBase,
                          color: row.competitor === false ? '#AEAEB2' : '#1D1D1F',
                        }}
                      >
                        {competitorVal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why Choose Linki */}
      <section style={{ padding: '64px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#1D1D1F',
              margin: '0 0 40px',
            }}
          >
            Why SEOs choose Linki over {competitor.name}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {competitor.whyLinki.map((card) => (
              <div
                key={card.title}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(0,113,227,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.375rem',
                    marginBottom: '14px',
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#1D1D1F',
                    margin: '0 0 8px',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#6E6E73',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where Competitor Has the Edge */}
      <section style={{ padding: '64px 24px', background: '#F5F5F7' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#1D1D1F',
              margin: '0 0 24px',
            }}
          >
            Where {competitor.name} is stronger
          </h2>
          <p style={{ color: '#6E6E73', fontSize: '0.9375rem', marginBottom: '20px', lineHeight: 1.6 }}>
            We believe in being honest. Here's where {competitor.name} has an advantage:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {competitor.competitorEdge.map((point) => (
              <li
                key={point}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  color: '#6E6E73',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#AEAEB2', flexShrink: 0, marginTop: '2px' }}>○</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom Line */}
      <section style={{ padding: '64px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '48px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#1D1D1F',
                margin: '0 0 24px',
              }}
            >
              The bottom line
            </h2>
            {competitor.bottomLine.split('\n\n').map((para, i) => (
              <p
                key={i}
                style={{
                  color: i === competitor.bottomLine.split('\n\n').length - 1 ? '#1D1D1F' : '#6E6E73',
                  fontSize: '0.9375rem',
                  lineHeight: 1.75,
                  margin: '0 0 16px',
                  textAlign: 'left',
                }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
          Ready to try a simpler approach?
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.0625rem',
            margin: '0 0 32px',
          }}
        >
          Free forever. No plugin. No credit card.
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
