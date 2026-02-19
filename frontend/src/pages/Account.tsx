import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getBillingPortal,
  cancelSubscription,
  upgradeToPro,
  getSubscription,
  getUsage,
  updateEmail,
  changePassword,
  type SubscriptionInfo,
  type UsageInfo,
} from '../services/api'

// ─── Shared style helpers ──────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--sp-6)',
  border: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sp-4)',
}

const label: React.CSSProperties = {
  display: 'block',
  color: '#6E6E73',
  fontSize: 'var(--text-sm)',
  marginBottom: 'var(--sp-2)',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: 'var(--sp-3) var(--sp-4)',
  background: '#F5F5F7',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 'var(--radius-md)',
  color: '#1D1D1F',
  fontSize: 'var(--text-base)',
  boxSizing: 'border-box',
  outline: 'none',
}

const primaryBtn: React.CSSProperties = {
  padding: 'var(--sp-2) var(--sp-5)',
  background: '#0071E3',
  border: 'none',
  borderRadius: '980px',
  color: 'white',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  padding: 'var(--sp-2) var(--sp-5)',
  background: 'transparent',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 'var(--radius-md)',
  color: '#6E6E73',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
}

const accentBtn: React.CSSProperties = {
  padding: 'var(--sp-2) var(--sp-5)',
  background: 'transparent',
  border: '1px solid #0071E3',
  borderRadius: '980px',
  color: '#0071E3',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
}

const sectionTitle: React.CSSProperties = {
  color: '#1D1D1F',
  fontWeight: 600,
  fontSize: 'var(--text-base)',
  margin: 0,
}

const inlineMeta: React.CSSProperties = {
  color: '#6E6E73',
  fontSize: 'var(--text-sm)',
  margin: 0,
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--color-danger-bg)',
      border: '1px solid var(--color-danger-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--sp-3) var(--sp-4)',
      color: 'var(--color-danger-text)',
      fontSize: 'var(--text-sm)',
    }}>
      {message}
    </div>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--color-success-bg)',
      border: '1px solid var(--color-success-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--sp-3) var(--sp-4)',
      color: 'var(--color-success-text)',
      fontSize: 'var(--text-sm)',
    }}>
      {message}
    </div>
  )
}

// ─── Account Details card ──────────────────────────────────────────────────

function AccountDetailsCard() {
  const { user, accessToken, refreshUser } = useAuth()
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const startEdit = () => {
    setNewEmail(user?.email ?? '')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setEditingEmail(true)
  }

  const cancelEdit = () => {
    setEditingEmail(false)
    setNewEmail('')
    setConfirmPassword('')
    setError(null)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || !confirmPassword) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await updateEmail(accessToken, newEmail.trim(), confirmPassword)
      await refreshUser()
      setEditingEmail(false)
      setNewEmail('')
      setConfirmPassword('')
      setSuccess('Email updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={card}>
      <p style={sectionTitle}>Account Details</p>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      {/* Email row */}
      <div>
        <p style={label}>Email</p>
        {!editingEmail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <p style={{ color: '#1D1D1F', fontSize: 'var(--text-base)', margin: 0, fontWeight: 500 }}>
              {user?.email}
            </p>
            <button onClick={startEdit} style={{ ...ghostBtn, padding: '4px 12px', fontSize: 'var(--text-xs)' }}>
              Change email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div>
              <label style={label}>New email address</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                style={input}
              />
            </div>
            <div>
              <label style={label}>Confirm with current password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Required to confirm your identity"
                style={input}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Saving…' : 'Save email'}
              </button>
              <button type="button" onClick={cancelEdit} style={ghostBtn}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Plan */}
      <div>
        <p style={label}>Plan</p>
        <span style={{
          display: 'inline-block',
          padding: '2px 12px',
          borderRadius: 'var(--radius-full)',
          background: user?.plan === 'pro' ? '#0071E3' : user?.plan === 'starter' ? '#34C759' : '#6E6E73',
          color: 'white',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {user?.plan}
        </span>
      </div>

      {/* Member since */}
      {createdDate && (
        <div>
          <p style={label}>Member since</p>
          <p style={{ color: '#1D1D1F', fontSize: 'var(--text-base)', margin: 0 }}>{createdDate}</p>
        </div>
      )}
    </div>
  )
}

// ─── Change Password card ──────────────────────────────────────────────────

function ChangePasswordCard() {
  const { accessToken } = useAuth()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPw !== confirmPw) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await changePassword(accessToken, currentPw, newPw, confirmPw)
      setSuccess('Password changed successfully.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={card}>
      <p style={sectionTitle}>Change Password</p>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div>
          <label style={label}>Current password</label>
          <input
            type="password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            required
            autoComplete="current-password"
            style={input}
          />
        </div>
        <div>
          <label style={label}>New password</label>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            required
            autoComplete="new-password"
            style={input}
          />
          <p style={{ ...inlineMeta, marginTop: 'var(--sp-1)' }}>
            Min 10 characters, must include letter, number, and special character.
          </p>
        </div>
        <div>
          <label style={label}>Confirm new password</label>
          <input
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            required
            autoComplete="new-password"
            style={input}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Subscription card ─────────────────────────────────────────────────────

function SubscriptionCard({
  subscription,
  usage,
  onManageBilling,
  billingLoading,
  onCancelSubscription,
  cancelLoading,
  isCancellationPending,
  onUpgradeToPro,
  upgradeLoading,
}: {
  subscription: SubscriptionInfo | null
  usage: UsageInfo | null
  onManageBilling: () => void
  billingLoading: boolean
  onCancelSubscription: () => Promise<void>
  cancelLoading: boolean
  isCancellationPending: boolean
  onUpgradeToPro: () => Promise<void>
  upgradeLoading: boolean
}) {
  const { user } = useAuth()
  const isPro = user?.plan === 'pro'
  const isStarter = user?.plan === 'starter'

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const statusLabel = subscription?.status === 'pending_cancellation'
    ? 'Cancellation scheduled'
    : subscription?.status
    ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
    : null

  const statusColor = subscription?.status === 'active'
    ? 'var(--color-success-text)'
    : subscription?.status === 'past_due'
    ? 'var(--color-warning-text)'
    : subscription?.status === 'pending_cancellation'
    ? 'var(--color-warning-text)'
    : '#6E6E73'

  const aiCallCount = usage?.call_count ?? 0
  const aiLimit = usage?.limit ?? 200
  const aiPeriodEnd = usage?.period_end
    ? new Date(usage.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const aiPercentage = Math.min((aiCallCount / aiLimit) * 100, 100)
  const aiNearLimit = aiCallCount >= Math.floor(aiLimit * 0.9)

  if (!isPro && !isStarter) {
    return (
      <div style={card}>
        <p style={sectionTitle}>Subscription</p>
        <p style={inlineMeta}>
          You're on the Free plan. Upgrade to Pro for AI-powered suggestions, 500 URL scans, and saved sessions.
        </p>
        <div>
          <Link
            to="/pricing"
            style={{
              display: 'inline-block',
              padding: 'var(--sp-2) var(--sp-5)',
              background: '#0071E3',
              borderRadius: '980px',
              color: 'white',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View pricing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={card}>
      <p style={sectionTitle}>Subscription</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {statusLabel && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={inlineMeta}>Status</span>
            <span style={{ color: statusColor, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {statusLabel}
            </span>
          </div>
        )}

        {renewalDate && subscription?.status === 'active' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={inlineMeta}>Next renewal</span>
            <span style={{ color: '#1D1D1F', fontSize: 'var(--text-sm)' }}>{renewalDate}</span>
          </div>
        )}

        {renewalDate && subscription?.status === 'canceled' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={inlineMeta}>Pro access until</span>
            <span style={{ color: '#1D1D1F', fontSize: 'var(--text-sm)' }}>{renewalDate}</span>
          </div>
        )}
      </div>

      {/* AI usage bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
          <span style={inlineMeta}>AI usage this month</span>
          <span style={{ color: aiNearLimit ? 'var(--color-warning-text)' : '#6E6E73', fontSize: 'var(--text-sm)' }}>
            {aiCallCount} / {aiLimit}
            {aiPeriodEnd && <span style={{ color: '#6E6E73' }}> · resets {aiPeriodEnd}</span>}
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#EBEBF0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${aiPercentage}%`,
            background: aiNearLimit ? 'var(--color-warning)' : '#0071E3',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {isStarter && (
          <div>
            <button
              onClick={onUpgradeToPro}
              disabled={upgradeLoading}
              style={{ ...primaryBtn, opacity: upgradeLoading ? 0.7 : 1, cursor: upgradeLoading ? 'not-allowed' : 'pointer' }}
            >
              {upgradeLoading ? 'Upgrading…' : 'Upgrade to Pro'}
            </button>
            <p style={{ ...inlineMeta, marginTop: 'var(--sp-2)' }}>
              Unlock 200 AI suggestions, 500 URL scans, and saved sessions. Prorated charge applies.
            </p>
          </div>
        )}

        <div>
          <button
            onClick={onManageBilling}
            disabled={billingLoading}
            style={{ ...accentBtn, opacity: billingLoading ? 0.7 : 1, cursor: billingLoading ? 'not-allowed' : 'pointer' }}
          >
            {billingLoading ? 'Loading…' : 'Manage billing'}
          </button>
          <p style={{ ...inlineMeta, marginTop: 'var(--sp-2)' }}>
            Update payment method or download invoices.
          </p>
        </div>

        {subscription?.status === 'active' && (
          <div>
            <button
              onClick={onCancelSubscription}
              disabled={cancelLoading}
              style={{
                padding: 'var(--sp-2) var(--sp-5)',
                background: 'transparent',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: cancelLoading ? 'not-allowed' : 'pointer',
                opacity: cancelLoading ? 0.7 : 1,
              }}
            >
              {cancelLoading ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          </div>
        )}

        {isCancellationPending && (
          <p style={{ ...inlineMeta, color: 'var(--color-warning-text)' }}>
            Cancellation scheduled — your access continues until the date shown above.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Account page ─────────────────────────────────────────────────────

export default function Account() {
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  // Check URL for success param (from Stripe checkout redirect)
  const params = new URLSearchParams(window.location.search)
  const justUpgraded = params.get('success') === 'true'

  useEffect(() => {
    if (!accessToken) return

    getSubscription(accessToken)
      .then(data => setSubscription(data))
      .catch(() => null)

    if (user?.plan === 'pro' || user?.plan === 'starter') {
      getUsage(accessToken)
        .then(data => setUsage(data))
        .catch(() => null)
    }
  }, [accessToken, user?.plan])

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

  const handleUpgradeToPro = async () => {
    setUpgradeLoading(true)
    try {
      await upgradeToPro(accessToken)
      window.location.href = '/account?success=true'
    } catch {
      // silently ignore — stay on page
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Pro subscription? You will keep access until the end of the current billing period.')) return
    setCancelLoading(true)
    try {
      const data = await cancelSubscription(accessToken)
      // Update local subscription state to reflect pending cancellation
      setSubscription(prev => prev ? {
        ...prev,
        status: 'pending_cancellation',
        current_period_end: data.current_period_end ?? prev.current_period_end,
      } : prev)
    } catch {
      // silently ignore — user stays on same state
    } finally {
      setCancelLoading(false)
    }
  }

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
          <h1 style={{ color: '#1D1D1F', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>
            Account
          </h1>
          <Link
            to="/app"
            style={{ color: '#6E6E73', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
          >
            ← Back to app
          </Link>
        </div>

        {/* Upgrade success banner */}
        {justUpgraded && (
          <SuccessBanner message={user?.plan === 'starter' ? "You're now on Starter! AI features are unlocked." : "You're now on Pro! All features are unlocked."} />
        )}

        <AccountDetailsCard />
        <ChangePasswordCard />
        <SubscriptionCard
          subscription={subscription}
          usage={usage}
          onManageBilling={handleManageBilling}
          billingLoading={billingLoading}
          onCancelSubscription={handleCancelSubscription}
          cancelLoading={cancelLoading}
          isCancellationPending={subscription?.status === 'pending_cancellation'}
          onUpgradeToPro={handleUpgradeToPro}
          upgradeLoading={upgradeLoading}
        />

        {/* Sign out */}
        <div style={{ ...card, gap: 'var(--sp-3)' }}>
          <p style={sectionTitle}>Session</p>
          <div>
            <button
              onClick={handleLogout}
              style={{
                padding: 'var(--sp-2) var(--sp-5)',
                background: 'transparent',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
