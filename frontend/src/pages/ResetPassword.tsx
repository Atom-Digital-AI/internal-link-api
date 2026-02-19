import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getPasswordStrength(password: string) {
  return {
    hasLength: password.length >= 10,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--sp-3) var(--sp-4)',
    background: '#F5F5F7',
    border: '1.5px solid transparent',
    borderRadius: 'var(--radius-md)',
    color: '#1D1D1F',
    fontSize: 'var(--text-base)',
    boxSizing: 'border-box',
  }

  const checkStyle = (pass: boolean): React.CSSProperties => ({
    color: pass ? 'var(--color-success)' : '#6E6E73',
    fontSize: 'var(--text-xs)',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password, confirm_password: confirmPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Reset failed.' }))
        throw new Error(err.detail || 'Reset failed.')
      }
      navigate('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5F5F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', color: '#6E6E73' }}>
          <p>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: '#0071E3' }}>Request a new one</Link>
        </div>
      </div>
    )
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
            Set new password
          </h1>
          <p style={{ color: '#6E6E73', marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>
            Choose a strong password for your account
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
            <label style={{ display: 'block', color: '#6E6E73', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              onFocus={e => { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
              onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
            />
            {password.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--sp-2)' }}>
                <span style={checkStyle(strength.hasLength)}>{strength.hasLength ? '✓' : '○'} At least 10 characters</span>
                <span style={checkStyle(strength.hasLetter)}>{strength.hasLetter ? '✓' : '○'} Contains a letter</span>
                <span style={checkStyle(strength.hasNumber)}>{strength.hasNumber ? '✓' : '○'} Contains a number</span>
                <span style={checkStyle(strength.hasSpecial)}>{strength.hasSpecial ? '✓' : '○'} Contains a special character</span>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', color: '#6E6E73', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ ...inputStyle, borderColor: passwordMismatch ? 'var(--color-danger)' : undefined }}
              onFocus={e => { if (!passwordMismatch) { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; } }}
              onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = passwordMismatch ? 'var(--color-danger)' : 'transparent'; e.target.style.boxShadow = 'none'; }}
            />
            {passwordMismatch && (
              <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordMismatch}
            style={{
              width: '100%',
              padding: 'var(--sp-3) var(--sp-4)',
              background: '#0071E3',
              border: 'none',
              borderRadius: '980px',
              color: 'white',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              cursor: loading || passwordMismatch ? 'not-allowed' : 'pointer',
              opacity: loading || passwordMismatch ? 0.7 : 1,
            }}
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}
