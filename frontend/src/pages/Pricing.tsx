import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Pricing() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/register')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ interval }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create checkout session.' }))
        throw new Error(err.detail || 'Failed to create checkout session.')
      }
      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/billing/portal`, {
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
      setLoading(false)
    }
  }

  const isPro = user?.plan === 'pro'
  const monthlyPrice = interval === 'monthly' ? '$29' : '$24'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--sp-16) var(--sp-6)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
        <h1 style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: 0 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: '#6E6E73', marginTop: 'var(--sp-3)', fontSize: 'var(--text-base)' }}>
          Start free, upgrade when you're ready
        </p>
      </div>

      {/* Interval toggle */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-8)', background: '#EBEBF0', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid rgba(0,0,0,0.08)' }}>
        <button
          onClick={() => setInterval('monthly')}
          style={{
            padding: 'var(--sp-2) var(--sp-5)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: interval === 'monthly' ? '#0071E3' : 'transparent',
            color: interval === 'monthly' ? 'white' : '#6E6E73',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval('annual')}
          style={{
            padding: 'var(--sp-2) var(--sp-5)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: interval === 'annual' ? '#0071E3' : 'transparent',
            color: interval === 'annual' ? 'white' : '#6E6E73',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          Annual <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 }}>(2 months free)</span>
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-3) var(--sp-4)',
          color: 'var(--color-danger-text)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--sp-6)',
        }}>
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'flex', gap: 'var(--sp-6)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '760px', width: '100%' }}>
        {/* Free plan */}
        <div style={{
          flex: '1',
          minWidth: '300px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--sp-8)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ color: '#1D1D1F', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--sp-2)' }}>Free</h2>
          <p style={{ color: '#6E6E73', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-6)' }}>
            $0<span style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}>/mo</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              '10 URLs per scan',
              'Basic link analysis',
              'Export results',
            ].map(feature => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#1D1D1F', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: '#6E6E73' }}>○</span> {feature}
              </li>
            ))}
            {[
              'AI suggestions',
              'Saved sessions',
            ].map(feature => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#AEAEB2', fontSize: 'var(--text-sm)', textDecoration: 'line-through', opacity: 0.5 }}>
                <span>✕</span> {feature}
              </li>
            ))}
          </ul>
          {isPro ? (
            <p style={{ color: '#6E6E73', fontSize: 'var(--text-sm)', textAlign: 'center' }}>Your previous plan</p>
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

        {/* Pro plan */}
        <div style={{
          flex: '1',
          minWidth: '300px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--sp-8)',
          border: '2px solid #0071E3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
          }}>
            POPULAR
          </div>
          <h2 style={{ color: '#1D1D1F', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--sp-2)' }}>Pro</h2>
          <p style={{ color: '#1D1D1F', fontSize: 'var(--text-3xl)', fontWeight: 700, margin: '0 0 var(--sp-6)' }}>
            {monthlyPrice}<span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: '#6E6E73' }}>/mo</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              '500 URLs per scan',
              'AI suggestions (200/month)',
              'Unlimited saved sessions',
              'Export results',
              'Priority support',
            ].map(feature => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#1D1D1F', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span> {feature}
              </li>
            ))}
          </ul>
          {isPro ? (
            <button
              onClick={handleManageBilling}
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'transparent',
                border: '1px solid #0071E3',
                borderRadius: '980px',
                color: '#0071E3',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Loading…' : 'Manage Subscription'}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                background: '#0071E3',
                border: 'none',
                borderRadius: '980px',
                color: 'white',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Loading…' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
