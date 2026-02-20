import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true },
  fields: [
    { name: 'metaTitleSuffix', type: 'text', defaultValue: ' — Linki', admin: { description: 'Appended to all page titles (e.g. " — Linki")' } },
    { name: 'defaultMetaDescription', type: 'textarea', defaultValue: 'AI-powered internal linking tool. Find opportunities and improve your site structure.' },
    { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Default Open Graph image for pages without a specific one' } },
  ],
}
