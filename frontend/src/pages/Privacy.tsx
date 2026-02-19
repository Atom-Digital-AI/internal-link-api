import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'

export default function Privacy() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#FFFFFF' }}>
      <MarketingNav />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#1D1D1F', margin: '0 0 8px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#6E6E73', fontSize: '0.875rem', marginBottom: '48px' }}>
          Last updated: February 2026
        </p>

        <hr style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '32px 0' }} />

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          1. Who we are
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          Linki is owned and operated by Atom Digital Group Ltd (company number SC866714), based in
          the United Kingdom. We are committed to protecting your personal data in line with the UK
          GDPR and the Data Protection Act 2018.
        </p>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          Contact:{' '}
          <a href="mailto:privacy@getlinki.app" style={{ color: '#0071E3', textDecoration: 'none' }}>
            privacy@getlinki.app
          </a>
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          2. What we collect
        </h2>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px', color: '#1D1D1F', lineHeight: 1.7 }}>
          <li>Account information: email address and password (hashed) when you register</li>
          <li>Usage data: pages crawled, features used, session activity</li>
          <li>Billing information: handled entirely by Stripe — we never store your card details</li>
          <li>
            Email address: used to send transactional emails via Brevo (e.g. password reset,
            billing receipts)
          </li>
          <li>Cookies: session cookies for authentication; no advertising cookies</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          3. How we use your data
        </h2>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px', color: '#1D1D1F', lineHeight: 1.7 }}>
          <li>To provide and improve the Linki service</li>
          <li>To process payments via Stripe</li>
          <li>To send transactional and product emails via Brevo</li>
          <li>
            To generate AI link suggestions (page content you submit is sent to our AI service for analysis)
          </li>
          <li>We do not sell your data to third parties</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          4. Third-party services
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          We use the following sub-processors:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px', color: '#1D1D1F', lineHeight: 1.7 }}>
          <li>
            <strong>Stripe</strong> (payments):{' '}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0071E3', textDecoration: 'none' }}
            >
              stripe.com/privacy
            </a>
          </li>
          <li>
            <strong>AI Service</strong> (analysis): Your URL content is sent to our AI service to generate link suggestions
          </li>
          <li>
            <strong>Brevo</strong> (email):{' '}
            <a
              href="https://www.brevo.com/legal/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0071E3', textDecoration: 'none' }}
            >
              brevo.com/legal/privacypolicy
            </a>
          </li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          5. Cookies
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          We use essential session cookies to keep you logged in. We do not use tracking or
          advertising cookies. You can disable cookies in your browser settings, but this will
          prevent you from staying logged in.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          6. Data retention
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          We retain your account data for as long as your account is active. If you delete your
          account, we remove your personal data within 30 days, except where retention is required
          by law (e.g. financial records for 7 years).
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          7. Your rights (UK GDPR &amp; CCPA)
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          You have the right to:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px', color: '#1D1D1F', lineHeight: 1.7 }}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
        </ul>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          To exercise these rights, email{' '}
          <a href="mailto:privacy@getlinki.app" style={{ color: '#0071E3', textDecoration: 'none' }}>
            privacy@getlinki.app
          </a>
          . For CCPA (California) residents: we do not sell personal information.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          8. Changes
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          We may update this policy from time to time. We will notify you by email of any material
          changes.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          9. Contact
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          For privacy questions:{' '}
          <a href="mailto:privacy@getlinki.app" style={{ color: '#0071E3', textDecoration: 'none' }}>
            privacy@getlinki.app
          </a>
        </p>
      </div>
      <MarketingFooter />
    </div>
  )
}
