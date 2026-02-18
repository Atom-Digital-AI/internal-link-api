import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--chrome-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--sp-16) var(--sp-6)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-4)',
      }}>
        <h1 style={{ color: 'var(--chrome-text)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '0 0 var(--sp-4)' }}>
          Account
        </h1>

        {/* Account info card */}
        <div style={{
          background: '#1e293b',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--sp-6)',
          border: '1px solid var(--chrome-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
        }}>
          <div>
            <p style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--sp-1)' }}>Email</p>
            <p style={{ color: 'var(--chrome-text)', fontSize: 'var(--text-base)', margin: 0, fontWeight: 500 }}>{user.email}</p>
          </div>

          <div>
            <p style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--sp-1)' }}>Plan</p>
            <span style={{
              display: 'inline-block',
              padding: '2px 12px',
              borderRadius: 'var(--radius-full)',
              background: user.plan === 'pro' ? 'var(--brand-gradient)' : '#334155',
              color: 'white',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {user.plan}
            </span>
          </div>
        </div>

        {/* Plan actions */}
        {user.plan === 'free' ? (
          <div style={{
            background: '#1e293b',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-6)',
            border: '1px solid var(--chrome-border)',
          }}>
            <p style={{ color: 'var(--chrome-text)', fontWeight: 600, margin: '0 0 var(--sp-2)' }}>Upgrade to Pro</p>
            <p style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--sp-4)' }}>
              Get 500 URLs/scan, AI suggestions, and unlimited saved sessions.
            </p>
            <Link
              to="/pricing"
              style={{
                display: 'inline-block',
                padding: 'var(--sp-2) var(--sp-5)',
                background: 'var(--brand-gradient)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View Plans
            </Link>
          </div>
        ) : (
          <div style={{
            background: '#1e293b',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-6)',
            border: '1px solid var(--chrome-border)',
          }}>
            <p style={{ color: 'var(--chrome-text)', fontWeight: 600, margin: '0 0 var(--sp-4)' }}>Subscription</p>
            <Link
              to="/pricing"
              style={{
                display: 'inline-block',
                padding: 'var(--sp-2) var(--sp-5)',
                background: 'transparent',
                border: '1px solid var(--chrome-accent)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--chrome-accent)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Manage Billing
            </Link>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'transparent',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger-text)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
