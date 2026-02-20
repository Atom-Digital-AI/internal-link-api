import type { CollectionConfig } from 'payload'

export const VsPages: CollectionConfig = {
  slug: 'vs-pages',
  access: { read: () => true },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'tagline', type: 'text' },
    { name: 'heroSubhead', type: 'textarea' },
    { name: 'verdict', type: 'textarea' },
    {
      name: 'tableRows',
      type: 'array',
      fields: [
        { name: 'feature', type: 'text' },
        { name: 'linki', type: 'text' },
        { name: 'competitor', type: 'text' },
      ],
    },
    {
      name: 'whyLinki',
      type: 'array',
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'textarea' },
      ],
    },
    {
      name: 'competitorEdge',
      type: 'array',
      fields: [{ name: 'point', type: 'text' }],
    },
    { name: 'bottomLine', type: 'textarea' },
    { name: 'metaTitle', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
  ],
}
