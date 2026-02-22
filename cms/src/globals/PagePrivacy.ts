import type { GlobalConfig } from 'payload'

export const PagePrivacy: GlobalConfig = {
  slug: 'page-privacy',
  access: { read: () => true },
  fields: [
    {
      name: 'body',
      type: 'richText',
      admin: {
        description: 'Full privacy policy content. Paste existing HTML or write in rich text.',
      },
    },
    { name: 'metaTitle', type: 'text', defaultValue: 'Privacy Policy — Linki' },
    { name: 'metaDescription', type: 'textarea', defaultValue: 'Learn how Linki collects, uses, and protects your personal data. We are committed to transparency and GDPR compliance.' },
  ],
}
