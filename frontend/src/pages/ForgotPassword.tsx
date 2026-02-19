import { useState } from 'react'
import { Link } from 'react-router-dom'
import linkiLogo from '../../media/images/logos/Linki Logo - No Spacing - Transparent.png'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Silently ignore - always show success message
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '40px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
          <img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto var(--sp-4)', display: 'block' }} />
          <h1 style={{ color: '#1D1D1F', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            Reset password
          </h1>
          <p style={{ color: '#6E6E73', marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {submitted ? (
          <div>
            <div style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-4)',
              color: 'var(--color-success-text)',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
              marginBottom: 'var(--sp-4)',
            }}>
              If that email exists, a reset link has been sent.
            </div>
            <Link
              to="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#0071E3',
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
              }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <label style={{ display: 'block', color: '#6E6E73', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: '#F5F5F7',
                  border: '1.5px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  color: '#1D1D1F',
                  fontSize: 'var(--text-base)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <Link
              to="/login"
              style={{ textAlign: 'center', color: '#0071E3', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
