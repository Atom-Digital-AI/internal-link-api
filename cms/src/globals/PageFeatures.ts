import type { GlobalConfig } from 'payload'

export const PageFeatures: GlobalConfig = {
  slug: 'page-features',
  access: { read: () => true },
  fields: [
    { name: 'heroHeading', type: 'text', defaultValue: 'Everything you need for smarter internal linking' },
    { name: 'heroSubtext', type: 'textarea', defaultValue: 'Linki gives you the tools to find, build, and track your internal links — all in one place.' },
    {
      name: 'features',
      type: 'array',
      defaultValue: [
        { category: 'SCANNING', h2: 'Bulk URL scanning', desc: "Crawl your sitemap and analyse up to 10 pages on the free plan or 500 pages on Pro. Linki discovers every existing internal link and maps your site's link structure automatically.", emoji: '🕷️' },
        { category: 'AI-POWERED', h2: 'AI-powered suggestions', desc: 'Linki reads the context of each page and recommends the perfect anchor text to add, plus exactly which target page to link to.', emoji: '✨' },
        { category: 'PRO FEATURE', h2: 'Cloud sessions', desc: 'Save your analysis sessions to the cloud. Come back tomorrow, next week, or next month — your crawl results and suggestions are waiting for you.', emoji: '☁️' },
        { category: 'PRO FEATURE', h2: 'Saved link opportunities', desc: 'Bookmark individual link suggestions across sessions. Build a queue of improvements to work through at your own pace without losing anything.', emoji: '🔖' },
        { category: 'INSIGHTS', h2: 'Link health tracking', desc: 'See at a glance which pages have too few internal links pointing to them. Spot your most under-linked content and prioritise accordingly.', emoji: '📊' },
        { category: 'EXPORT', h2: 'Export & integrate', desc: 'Download all your link opportunities as a CSV file. Drop them into your CMS workflow, share with your team, or import into your project management tool.', emoji: '⬇️' },
      ],
      fields: [
        { name: 'category', type: 'text' },
        { name: 'h2', type: 'text' },
        { name: 'desc', type: 'textarea' },
        { name: 'emoji', type: 'text' },
      ],
    },
    { name: 'metaTitle', type: 'text', defaultValue: 'Features - Linki Internal Linking Tool' },
    { name: 'metaDescription', type: 'textarea', defaultValue: "Discover Linki's features: bulk URL scanning, AI-powered link suggestions, cloud sessions, saved opportunities, link health tracking, and CSV export." },
  ],
}
