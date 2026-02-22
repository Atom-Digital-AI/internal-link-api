import type { GlobalConfig } from 'payload'

export const PageHome: GlobalConfig = {
  slug: 'page-home',
  access: { read: () => true },
  fields: [
    { name: 'heroHeading', type: 'text', defaultValue: 'Internal linking made intelligent' },
    { name: 'heroSubtext', type: 'textarea', defaultValue: 'Linki finds pages that need internal links and uses AI to suggest exactly where to add them.' },
    { name: 'featuresHeading', type: 'text', defaultValue: 'Everything you need for smarter internal linking' },
    {
      name: 'features',
      type: 'array',
      defaultValue: [
        { icon: '🕷️', title: 'Crawl & Analyse', desc: 'Scan up to 500 pages, extract all existing links and discover opportunities' },
        { icon: '✨', title: 'AI Suggestions', desc: 'AI-powered suggestions tell you exactly which words to link and where to point them' },
        { icon: '🔖', title: 'Save Sessions', desc: 'Pro users can save analysis sessions to revisit and continue later' },
        { icon: '⬇️', title: 'Export Results', desc: 'Download your link opportunities as CSV for use in any workflow' },
      ],
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'desc', type: 'textarea' },
      ],
    },
    { name: 'stepsHeading', type: 'text', defaultValue: 'How it works' },
    {
      name: 'steps',
      type: 'array',
      defaultValue: [
        { num: '1', title: 'Enter your domain', desc: 'Type in your website URL and let Linki crawl your pages' },
        { num: '2', title: 'Select pages to analyse', desc: 'Choose which pages you want to find linking opportunities for' },
        { num: '3', title: 'Get AI suggestions', desc: 'Receive precise anchor text and target page recommendations' },
      ],
      fields: [
        { name: 'num', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'desc', type: 'textarea' },
      ],
    },
    { name: 'pricingHeading', type: 'text', defaultValue: 'Simple, transparent pricing' },
    { name: 'pricingSubtext', type: 'text', defaultValue: "Start free, upgrade when you're ready" },
    { name: 'ctaHeading', type: 'text', defaultValue: 'Ready to improve your internal linking?' },
    { name: 'ctaSubtext', type: 'textarea', defaultValue: 'Join hundreds of SEOs using Linki to build smarter site structure.' },
    { name: 'metaTitle', type: 'text', defaultValue: 'Linki - AI-Powered Internal Linking Tool for SEO' },
    { name: 'metaDescription', type: 'textarea', defaultValue: 'Linki finds pages that need internal links and uses AI to suggest exactly where to add them. Improve your site structure and boost SEO.' },
  ],
}
