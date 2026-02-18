import { useState } from 'react'
import { Link } from 'react-router-dom'

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
      background: 'var(--chrome-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-6)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#1e293b',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-8)',
        border: '1px solid var(--chrome-border)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
          <h1 style={{ color: 'var(--chrome-text)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            Reset password
          </h1>
          <p style={{ color: 'var(--chrome-text-muted)', marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>
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
                color: 'var(--chrome-accent)',
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
              <label style={{ display: 'block', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
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
                  background: '#0f172a',
                  border: '1px solid var(--chrome-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--chrome-text)',
                  fontSize: 'var(--text-base)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--brand-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
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
              style={{ textAlign: 'center', color: 'var(--chrome-accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
