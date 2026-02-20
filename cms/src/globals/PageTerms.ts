import type { GlobalConfig } from 'payload'

export const PageTerms: GlobalConfig = {
  slug: 'page-terms',
  access: { read: () => true },
  fields: [
    {
      name: 'body',
      type: 'richText',
    },
    { name: 'metaTitle', type: 'text', defaultValue: 'Terms of Service — Linki' },
    { name: 'metaDescription', type: 'textarea', defaultValue: 'Read the terms and conditions for using Linki.' },
  ],
}
