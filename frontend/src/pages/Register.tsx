import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';

function getPasswordStrength(password: string) {
  return {
    hasLength: password.length >= 10,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await register(email, password, confirmPassword)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)' }}>
      {/* Left brand panel */}
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
              <span style={{ color: '#0071E3', fontWeight: 700 }}>✓</span>
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
        overflowY: 'auto',
      }}>
        <div className="auth-mobile-logo" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Linki</span>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Create account</h2>
          <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: '#6E6E73' }}>Free forever, upgrade when ready</p>

          {error && (
            <div style={{ background: '#FFF2F1', border: '1px solid rgba(255,59,48,0.20)', borderRadius: '10px', padding: '12px 16px', color: '#D70015', fontSize: '0.875rem', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px', background: '#F5F5F7',
                  border: '1.5px solid transparent', borderRadius: '10px',
                  fontSize: '0.9375rem', color: '#1D1D1F', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  // Keep confirm in sync when Chrome autofill fills both fields simultaneously
                  if (confirmPassword.length === 0 || e.target.value === confirmPassword) {
                    setConfirmPassword(e.target.value)
                  }
                }}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 14px', background: '#F5F5F7',
                  border: '1.5px solid transparent', borderRadius: '10px',
                  fontSize: '0.9375rem', color: '#1D1D1F', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
              {password.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: strength.hasLength ? '#248A3D' : '#6E6E73' }}>{strength.hasLength ? '✓' : '○'} At least 10 characters</span>
                  <span style={{ fontSize: '0.75rem', color: strength.hasLetter ? '#248A3D' : '#6E6E73' }}>{strength.hasLetter ? '✓' : '○'} Contains a letter</span>
                  <span style={{ fontSize: '0.75rem', color: strength.hasNumber ? '#248A3D' : '#6E6E73' }}>{strength.hasNumber ? '✓' : '○'} Contains a number</span>
                  <span style={{ fontSize: '0.75rem', color: strength.hasSpecial ? '#248A3D' : '#6E6E73' }}>{strength.hasSpecial ? '✓' : '○'} Contains a special character</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 14px', background: '#F5F5F7',
                  border: `1.5px solid ${passwordMismatch ? 'rgba(255,59,48,0.60)' : 'transparent'}`, borderRadius: '10px',
                  fontSize: '0.9375rem', color: '#1D1D1F', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => { e.target.style.background = '#FFF'; if (!passwordMismatch) { e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; } }}
                onBlur={e => { e.target.style.background = '#F5F5F7'; if (!passwordMismatch) { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; } }}
              />
              {passwordMismatch && (
                <p style={{ color: '#D70015', fontSize: '0.75rem', marginTop: '4px', margin: '4px 0 0' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              style={{
                width: '100%', padding: '13px',
                background: loading || passwordMismatch ? '#AEAEB2' : '#0071E3',
                color: '#fff', border: 'none', borderRadius: '980px',
                fontSize: '1rem', fontWeight: 600,
                cursor: loading || passwordMismatch ? 'not-allowed' : 'pointer',
                marginTop: '8px', transition: 'background 150ms',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#6E6E73' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0071E3', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
