import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { getGlobal } from '../services/cms'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'
import { createCheckoutSession, upgradeToPro } from '../services/api'

interface PricingData {
  heroHeading: string
  heroSubtext: string
  faqItems: { q: string; a: string }[]
  metaTitle: string
  metaDescription: string
}

const comparisonRows: { label: string; free: string | null; starter: string | null; pro: string }[] = [
  { label: 'URLs per scan',        free: '10',     starter: '50',          pro: '500'        },
  { label: 'Link analysis',        free: 'Basic',  starter: 'AI-powered',  pro: 'AI-powered' },
  { label: 'AI suggestions',       free: null,     starter: '30 / month',  pro: '200 / month'},
  { label: 'Saved sessions',       free: null,     starter: null,          pro: 'Unlimited'  },
  { label: 'Export results (CSV)', free: '✓',      starter: '✓',           pro: '✓'          },
  { label: 'Priority support',     free: null,     starter: null,          pro: '✓'          },
]

export default function Pricing() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null) // tracks which action is loading
  const [error, setError] = useState<string | null>(null)
  const [cmsContent, setCmsContent] = useState<PricingData | null>(null)

  useEffect(() => {
    getGlobal<PricingData>('page-pricing').then(setCmsContent).catch(() => {})
  }, [])

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (cmsContent?.faqItems ?? []).map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  }

  const isPro = user?.plan === 'pro'
  const isStarter = user?.plan === 'starter'

  const handleStarterCheckout = async () => {
    if (!user) {
      navigate('/register')
      return
    }
    setLoading('starter')
    setError(null)
    try {
      const data = await createCheckoutSession(accessToken, 'starter')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const handleProCheckout = async () => {
    if (!user) {
      navigate('/register')
      return
    }
    setLoading('pro-checkout')
    setError(null)
    try {
      const data = await createCheckoutSession(accessToken, 'pro')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const handleUpgradeToPro = async () => {
    setLoading('upgrade')
    setError(null)
    try {
      await upgradeToPro(accessToken)
      window.location.href = '/account?success=true'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setLoading('manage')
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/billing/portal`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to open billing portal.')
      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const cellBase: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 'var(--text-sm)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    textAlign: 'center',
  }

  return (
    <>
      <Helmet>
        <title>{cmsContent?.metaTitle ?? 'Pricing - Linki | Free, Starter & Pro Plans'}</title>
        <meta name="description" content={cmsContent?.metaDescription ?? 'Choose the right Linki plan: Free for basic link analysis, Starter for AI suggestions, or Pro for 500 URLs, unlimited sessions, and priority support.'} />
        <link rel="canonical" href="https://getlinki.app/pricing" />
        <meta property="og:title" content={cmsContent?.metaTitle ?? 'Pricing - Linki | Free, Starter & Pro Plans'} />
        <meta property="og:description" content={cmsContent?.metaDescription ?? 'Choose the right Linki plan: Free for basic link analysis, Starter for AI suggestions, or Pro for 500 URLs, unlimited sessions, and priority support.'} />
        <meta property="og:url" content="https://getlinki.app/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={cmsContent?.metaTitle ?? 'Pricing - Linki | Free, Starter & Pro Plans'} />
        <meta name="twitter:description" content={cmsContent?.metaDescription ?? 'Choose the right Linki plan: Free for basic link analysis, Starter for AI suggestions, or Pro for 500 URLs, unlimited sessions, and priority support.'} />
        <script type="application/ld+json">{JSON.stringify(faqPageSchema)}</script>
      </Helmet>
      <MarketingNav />
      <div style={{
        minHeight: '100vh',
        background: '#F5F5F7',
        fontFamily: 'var(--font-sans)',
        paddingTop: 'calc(var(--sp-16) + 60px)',
        paddingBottom: 'var(--sp-16)',
        paddingLeft: 'var(--sp-6)',
        paddingRight: 'var(--sp-6)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-12)' }}>
          <h1 style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-3)' }}>
            {cmsContent?.heroHeading ?? 'Simple, transparent pricing'}
          </h1>
          <p style={{ color: '#6E6E73', fontSize: 'var(--text-base)', margin: 0 }}>
            {cmsContent?.heroSubtext ?? "Start free. Upgrade when you're ready. Cancel any time."}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-3) var(--sp-4)',
            color: 'var(--color-danger-text)',
            fontSize: 'var(--text-sm)',
            maxWidth: '960px',
            margin: '0 auto var(--sp-6)',
          }}>
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div style={{
          display: 'flex',
          gap: 'var(--sp-5)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '960px',
          margin: '0 auto var(--sp-16)',
        }}>

          {/* Free plan */}
          <div style={{
            flex: '1',
            minWidth: '260px',
            maxWidth: '300px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-8)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <h2 style={{ color: '#1D1D1F', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--sp-1)' }}>
              Free
            </h2>
            <p style={{ color: '#6E6E73', fontSize: '0.875rem', margin: '0 0 var(--sp-4)' }}>
              Everything you need to get started
            </p>
            <p style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-6)' }}>
              £0<span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: '#6E6E73' }}>/mo</span>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {comparisonRows.map(row => (
                <li key={row.label} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  fontSize: 'var(--text-sm)',
                  color: row.free ? '#1D1D1F' : '#AEAEB2',
                  opacity: row.free ? 1 : 0.55,
                }}>
                  <span style={{ flexShrink: 0, color: row.free ? '#6E6E73' : '#AEAEB2' }}>
                    {row.free ? '○' : '✕'}
                  </span>
                  {row.free
                    ? row.free === '✓' ? row.label : `${row.label} — ${row.free}`
                    : row.label}
                </li>
              ))}
            </ul>
            {!user ? (
              <Link
                to="/register"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'transparent',
                  border: '1.5px solid rgba(0,0,0,0.15)',
                  borderRadius: '980px',
                  color: '#1D1D1F',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                Get started free
              </Link>
            ) : isPro || isStarter ? (
              <p style={{ color: '#6E6E73', fontSize: 'var(--text-sm)', textAlign: 'center', margin: 0 }}>Previous plan</p>
            ) : (
              <div style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 'var(--radius-md)',
                color: '#6E6E73',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                textAlign: 'center',
              }}>
                Current plan
              </div>
            )}
          </div>

          {/* Starter plan */}
          <div style={{
            flex: '1',
            minWidth: '260px',
            maxWidth: '300px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-8)',
            border: isStarter ? '2px solid #34C759' : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isStarter ? '0 4px 24px rgba(52,199,89,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <h2 style={{ color: '#1D1D1F', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--sp-1)' }}>
              Starter
            </h2>
            <p style={{ color: '#6E6E73', fontSize: '0.875rem', margin: '0 0 var(--sp-4)' }}>
              AI features without the full commitment
            </p>
            <p style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-6)' }}>
              £4.99<span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: '#6E6E73' }}>/mo</span>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {comparisonRows.map(row => (
                <li key={row.label} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  fontSize: 'var(--text-sm)',
                  color: row.starter ? '#1D1D1F' : '#AEAEB2',
                  opacity: row.starter ? 1 : 0.55,
                }}>
                  <span style={{ flexShrink: 0, color: row.starter ? '#34C759' : '#AEAEB2' }}>
                    {row.starter ? '✓' : '✕'}
                  </span>
                  {row.starter
                    ? row.starter === '✓' ? row.label : `${row.label} — ${row.starter}`
                    : row.label}
                </li>
              ))}
            </ul>
            {isStarter ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <div style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 'var(--radius-md)',
                  color: '#6E6E73',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}>
                  Current plan
                </div>
                <button
                  onClick={handleUpgradeToPro}
                  disabled={loading !== null}
                  style={{
                    width: '100%',
                    padding: 'var(--sp-3) var(--sp-4)',
                    background: '#0071E3',
                    border: 'none',
                    borderRadius: '980px',
                    color: 'white',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                    opacity: loading !== null ? 0.7 : 1,
                  }}
                >
                  {loading === 'upgrade' ? 'Upgrading…' : 'Upgrade to Pro'}
                </button>
              </div>
            ) : isPro ? (
              <p style={{ color: '#6E6E73', fontSize: 'var(--text-sm)', textAlign: 'center', margin: 0 }}>Previous plan</p>
            ) : (
              <button
                onClick={handleStarterCheckout}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: '#34C759',
                  border: 'none',
                  borderRadius: '980px',
                  color: 'white',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null ? 0.7 : 1,
                }}
              >
                {loading === 'starter' ? 'Loading…' : user ? 'Get Starter' : 'Get started'}
              </button>
            )}
          </div>

          {/* Pro plan */}
          <div style={{
            flex: '1',
            minWidth: '260px',
            maxWidth: '300px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-8)',
            border: '2px solid #0071E3',
            boxShadow: '0 4px 24px rgba(0,113,227,0.12)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0071E3',
              color: 'white',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              padding: '4px 16px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}>
              MOST POPULAR
            </div>
            <h2 style={{ color: '#1D1D1F', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--sp-1)' }}>
              Pro
            </h2>
            <p style={{ color: '#6E6E73', fontSize: '0.875rem', margin: '0 0 var(--sp-4)' }}>
              For serious SEO work
            </p>
            <p style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-6)' }}>
              £14.99<span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: '#6E6E73' }}>/mo</span>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {comparisonRows.map(row => (
                <li key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#1D1D1F', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: '#0071E3', flexShrink: 0 }}>✓</span>
                  {row.pro === '✓' ? row.label : `${row.pro === '✓' ? row.label : `${row.label} — ${row.pro}`}`}
                </li>
              ))}
            </ul>
            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'transparent',
                  border: '1.5px solid #0071E3',
                  borderRadius: '980px',
                  color: '#0071E3',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null ? 0.7 : 1,
                }}
              >
                {loading === 'manage' ? 'Loading…' : 'Manage Subscription'}
              </button>
            ) : isStarter ? (
              <button
                onClick={handleUpgradeToPro}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: '#0071E3',
                  border: 'none',
                  borderRadius: '980px',
                  color: 'white',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null ? 0.7 : 1,
                }}
              >
                {loading === 'upgrade' ? 'Upgrading…' : 'Upgrade to Pro'}
              </button>
            ) : (
              <button
                onClick={handleProCheckout}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: '#0071E3',
                  border: 'none',
                  borderRadius: '980px',
                  color: 'white',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null ? 0.7 : 1,
                }}
              >
                {loading === 'pro-checkout' ? 'Loading…' : user ? 'Upgrade to Pro' : 'Get started free'}
              </button>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ maxWidth: '960px', margin: '0 auto var(--sp-16)' }}>
          <h2 style={{ textAlign: 'center', color: '#1D1D1F', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '0 0 var(--sp-8)' }}>
            Compare plans
          </h2>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
              <thead>
                <tr style={{ background: '#F5F5F7' }}>
                  <th style={{ ...cellBase, textAlign: 'left', fontWeight: 600, color: '#6E6E73', width: '40%' }}>Feature</th>
                  <th style={{ ...cellBase, fontWeight: 700, color: '#1D1D1F' }}>Free</th>
                  <th style={{ ...cellBase, fontWeight: 700, color: '#34C759' }}>Starter</th>
                  <th style={{ ...cellBase, fontWeight: 700, color: '#0071E3' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ ...cellBase, textAlign: 'left', color: '#1D1D1F', fontWeight: 500 }}>{row.label}</td>
                    <td style={{ ...cellBase, color: row.free ? '#1D1D1F' : '#AEAEB2' }}>
                      {row.free ?? <span style={{ fontSize: '1.1em' }}>—</span>}
                    </td>
                    <td style={{ ...cellBase, color: row.starter ? '#1D1D1F' : '#AEAEB2' }}>
                      {row.starter === '✓'
                        ? <span style={{ color: '#34C759', fontWeight: 700 }}>✓</span>
                        : row.starter ?? <span style={{ fontSize: '1.1em' }}>—</span>}
                    </td>
                    <td style={{ ...cellBase, color: '#1D1D1F', fontWeight: row.pro === '✓' ? 400 : 500 }}>
                      {row.pro === '✓'
                        ? <span style={{ color: '#0071E3', fontWeight: 700 }}>✓</span>
                        : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#1D1D1F', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '0 0 var(--sp-8)' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {(cmsContent?.faqItems ?? []).map(({ q, a }) => (
              <div key={q} style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--sp-6)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <p style={{ color: '#1D1D1F', fontWeight: 600, fontSize: 'var(--text-base)', margin: '0 0 var(--sp-2)' }}>{q}</p>
                <p style={{ color: '#6E6E73', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      <MarketingFooter />
    </>
  )
}
