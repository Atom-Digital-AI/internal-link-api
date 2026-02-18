import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
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
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--brand-gradient)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sp-4)',
            fontWeight: 900,
            fontSize: '1.125rem',
            color: 'white',
          }}>IL</div>
          <h1 style={{ color: 'var(--chrome-text)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            Sign in
          </h1>
          <p style={{ color: 'var(--chrome-text-muted)', marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>
            Welcome back to Internal Link Finder
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {error && (
            <div style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-3) var(--sp-4)',
              color: 'var(--color-danger-text)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

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

          <div>
            <label style={{ display: 'block', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              style={{ color: 'var(--chrome-accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-6)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--chrome-accent)', textDecoration: 'none' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
