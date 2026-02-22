import type { GlobalConfig } from 'payload'

export const PagePricing: GlobalConfig = {
  slug: 'page-pricing',
  access: { read: () => true },
  fields: [
    { name: 'heroHeading', type: 'text', defaultValue: 'Simple, transparent pricing' },
    { name: 'heroSubtext', type: 'text', defaultValue: "Start free. Upgrade when you're ready. Cancel any time." },
    {
      name: 'faqItems',
      type: 'array',
      defaultValue: [
        { q: 'Can I cancel my subscription at any time?', a: 'Yes. Cancel from your account settings and your subscription ends at the next billing date. You keep access until then.' },
        { q: 'How do I upgrade from Starter to Pro?', a: 'Click "Upgrade to Pro" on the pricing page or in your account. Stripe calculates unused Starter credit and charges only the difference — you get Pro access instantly.' },
        { q: 'What counts as an AI suggestion?', a: 'Each time Linki generates a link recommendation for a page using Google Gemini, that counts as one suggestion. Starter plans include 30 per month; Pro plans include 200.' },
        { q: 'What happens to my saved sessions if I downgrade?', a: 'Your sessions are kept on our servers for 30 days after downgrading in case you re-subscribe. After that they are permanently deleted.' },
        { q: 'Do you offer refunds?', a: "We don't offer partial-month refunds, but if something goes wrong please email hello@linki.app and we'll do our best to help." },
      ],
      fields: [
        { name: 'q', type: 'text' },
        { name: 'a', type: 'textarea' },
      ],
    },
    { name: 'metaTitle', type: 'text', defaultValue: 'Pricing - Linki | Free, Starter & Pro Plans' },
    { name: 'metaDescription', type: 'textarea', defaultValue: 'Choose the right Linki plan: Free for basic link analysis, Starter for AI suggestions, or Pro for 500 URLs, unlimited sessions, and priority support.' },
  ],
}
