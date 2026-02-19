import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';

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
      display: 'flex',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Left brand panel — hidden on mobile */}
      <div style={{
        flex: '1',
        background: '#F5F5F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        gap: '32px',
      }} className="auth-brand-panel">
        <img src={linkiLogo} alt="Linki" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>Linki</h1>
          <p style={{ margin: 0, fontSize: '1.0625rem', color: '#6E6E73' }}>Smart internal linking for better SEO</p>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {['AI-powered link suggestions', 'One-click implementation', 'Track link health across your site'].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9375rem', color: '#1D1D1F' }}>
              <span style={{ color: '#0071E3', fontWeight: 700, fontSize: '1rem' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        borderLeft: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* Mobile-only logo */}
        <div className="auth-mobile-logo" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Linki</span>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Sign in</h2>
          <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: '#6E6E73' }}>Welcome back</p>

          {error && (
            <div style={{
              background: '#FFF2F1',
              border: '1px solid rgba(255,59,48,0.20)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#D70015',
              fontSize: '0.875rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#F5F5F7',
                  border: '1.5px solid transparent',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  color: '#1D1D1F',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => {
                  e.target.style.background = '#FFF';
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = '#F5F5F7';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#F5F5F7',
                  border: '1.5px solid transparent',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  color: '#1D1D1F',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => {
                  e.target.style.background = '#FFF';
                  e.target.style.borderColor = '#0071E3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = '#F5F5F7';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#6E6E73', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: '#0071E3', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#AEAEB2' : '#0071E3',
                color: '#fff',
                border: 'none',
                borderRadius: '980px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'background 150ms',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#6E6E73' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0071E3', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
