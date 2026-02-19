import { Link } from 'react-router-dom'

const compareLinks = [
  { to: '/linki-vs-link-whisper', label: 'Linki vs Link Whisper' },
  { to: '/linki-vs-linkstorm',    label: 'Linki vs LinkStorm' },
  { to: '/linki-vs-inlinks',      label: 'Linki vs InLinks' },
  { to: '/linki-vs-linkboss',     label: 'Linki vs LinkBoss' },
  { to: '/linki-vs-seojuice',     label: 'Linki vs SEOJuice' },
]

export default function MarketingFooter() {
  return (
    <footer style={{
      background: '#F5F5F7',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      padding: '32px 40px',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <span style={{ color: '#6E6E73', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} Linki
          </span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {[
              { to: '/privacy', label: 'Privacy' },
              { to: '/terms', label: 'Terms' },
              { to: '/pricing', label: 'Pricing' },
              { to: '/blog', label: 'Blog' },
              { to: '/login', label: 'Sign in' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{ color: '#6E6E73', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            color: '#AEAEB2',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            Compare
          </span>
          {compareLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ color: '#6E6E73', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
