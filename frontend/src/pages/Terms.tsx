import { Helmet } from 'react-helmet-async'
import MarketingNav from '../components/MarketingNav'
import MarketingFooter from '../components/MarketingFooter'

export default function Terms() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#FFFFFF' }}>
      <Helmet>
        <title>Terms of Service — Linki</title>
        <meta name="description" content="Read the terms and conditions for using Linki, the AI-powered internal linking tool." />
        <link rel="canonical" href="https://getlinki.app/terms" />
        <meta property="og:title" content="Terms of Service — Linki" />
        <meta property="og:description" content="Read the terms and conditions for using Linki, the AI-powered internal linking tool." />
        <meta property="og:url" content="https://getlinki.app/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Linki" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service — Linki" />
        <meta name="twitter:description" content="Read the terms and conditions for using Linki, the AI-powered internal linking tool." />
      </Helmet>
      <MarketingNav />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '120px 40px 80px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#1D1D1F', margin: '0 0 8px' }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: '#6E6E73', fontSize: '0.875rem', marginBottom: '48px' }}>
          Last updated: February 2026
        </p>

        <hr style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '32px 0' }} />

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          1. Acceptance of terms
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          By creating a Linki account or using the Service, you agree to these Terms. If you do not
          agree, do not use Linki.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          2. Account registration
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          You must provide accurate information when registering. You are responsible for maintaining
          the security of your account credentials. You must be at least 18 years old to use Linki.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          3. Acceptable use
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          You agree not to:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px', color: '#1D1D1F', lineHeight: 1.7 }}>
          <li>Use Linki to crawl websites you do not own or have permission to analyse</li>
          <li>Attempt to circumvent usage limits or access controls</li>
          <li>Use the service for any unlawful purpose</li>
          <li>Resell or redistribute Linki without our consent</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          4. Pro subscription &amp; billing
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          Pro plans are billed monthly at £14.99/month. Payments are processed by Stripe.
          Subscriptions renew automatically unless cancelled. You can cancel at any time from your
          account settings; cancellation takes effect at the end of the billing period. We do not
          offer refunds for partial months.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          5. Free plan limitations
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          The free plan is provided as-is and may be subject to rate limits or feature restrictions
          at our discretion.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          6. Intellectual property
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          Linki and its original content are owned by Atom Digital Group Ltd (SC866714). You retain ownership of
          your own website content that you submit for analysis. By using the service you grant us a
          limited licence to process that content solely to provide the service.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          7. Disclaimers
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          The service is provided "as is" without warranties of any kind. We do not guarantee that
          AI suggestions will be accurate or suitable for your use case. We are not responsible for
          SEO outcomes resulting from link changes you make.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          8. Limitation of liability
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          To the fullest extent permitted by law, Linki's liability for any claim arising from use
          of the service is limited to the amount you paid us in the 30 days preceding the claim, or
          £50, whichever is greater.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          9. Governing law
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          These Terms are governed by the laws of England and Wales. Disputes shall be subject to
          the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          10. Changes
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          We reserve the right to modify these Terms at any time. We will provide at least 14 days'
          notice of material changes via email or in-app notice.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', margin: '40px 0 12px' }}>
          11. Contact
        </h2>
        <p style={{ color: '#1D1D1F', lineHeight: 1.7, fontSize: '1rem', margin: '0 0 16px' }}>
          For questions about these Terms:{' '}
          <a href="mailto:hello@getlinki.app" style={{ color: '#0071E3', textDecoration: 'none' }}>
            hello@getlinki.app
          </a>
        </p>
      </div>
      <MarketingFooter />
    </div>
  )
}
