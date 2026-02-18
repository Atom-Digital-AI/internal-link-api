import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

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
    background: '#0f172a',
    border: '1px solid var(--chrome-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--chrome-text)',
    fontSize: 'var(--text-base)',
    boxSizing: 'border-box',
  }

  const checkStyle = (pass: boolean): React.CSSProperties => ({
    color: pass ? 'var(--color-success)' : 'var(--chrome-text-muted)',
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
        background: 'var(--chrome-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-6)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--chrome-text-muted)' }}>
          <p>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: 'var(--chrome-accent)' }}>Request a new one</Link>
        </div>
      </div>
    )
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
            Set new password
          </h1>
          <p style={{ color: 'var(--chrome-text-muted)', marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>
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
            <label style={{ display: 'block', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
              New password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" style={inputStyle} />
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
            <label style={{ display: 'block', color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-2)' }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ ...inputStyle, borderColor: passwordMismatch ? 'var(--color-danger)' : undefined }}
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
              background: 'var(--brand-gradient)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
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
