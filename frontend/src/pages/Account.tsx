import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getBillingPortal } from '../services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface AiUsageData {
  call_count: number;
  period_end: string | null;
}

export default function Account() {
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [aiUsage, setAiUsage] = useState<AiUsageData | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    if (user?.plan === 'pro' && accessToken) {
      fetch(`${API_BASE}/user/me/usage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setAiUsage(data))
        .catch(() => null)
    }
  }, [user, accessToken])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const data = await getBillingPortal(accessToken)
      window.location.href = data.url
    } catch {
      navigate('/pricing')
    } finally {
      setBillingLoading(false)
    }
  }

  if (!user) return null

  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const aiCallCount = aiUsage?.call_count ?? 0
  const aiPeriodEnd = aiUsage?.period_end
    ? new Date(aiUsage.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

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

          {createdDate && (
            <div>
              <p style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)', margin: '0 0 var(--sp-1)' }}>Member since</p>
              <p style={{ color: 'var(--chrome-text)', fontSize: 'var(--text-base)', margin: 0 }}>{createdDate}</p>
            </div>
          )}
        </div>

        {/* AI usage (Pro only) */}
        {user.plan === 'pro' && (
          <div style={{
            background: '#1e293b',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--sp-6)',
            border: '1px solid var(--chrome-border)',
          }}>
            <p style={{ color: 'var(--chrome-text)', fontWeight: 600, margin: '0 0 var(--sp-3)' }}>AI Usage This Month</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
              <span style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)' }}>
                {aiCallCount} / 200 calls used
              </span>
              {aiPeriodEnd && (
                <span style={{ color: 'var(--chrome-text-muted)', fontSize: 'var(--text-sm)' }}>
                  Resets {aiPeriodEnd}
                </span>
              )}
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#334155',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((aiCallCount / 200) * 100, 100)}%`,
                background: aiCallCount >= 180 ? 'var(--color-danger)' : 'var(--brand-gradient)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

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
              Upgrade to Pro
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
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              style={{
                padding: 'var(--sp-2) var(--sp-5)',
                background: 'transparent',
                border: '1px solid var(--chrome-accent)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--chrome-accent)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: billingLoading ? 'not-allowed' : 'pointer',
                opacity: billingLoading ? 0.7 : 1,
              }}
            >
              {billingLoading ? 'Loading…' : 'Manage Billing'}
            </button>
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
