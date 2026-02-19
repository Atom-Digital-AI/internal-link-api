export interface CompetitorData {
  slug: string
  name: string
  tagline: string
  heroSubhead: string
  verdict: string
  tableRows: {
    feature: string
    linki: string | boolean
    competitor: string | boolean
  }[]
  whyLinki: {
    icon: string
    title: string
    body: string
  }[]
  competitorEdge: string[]
  bottomLine: string
}

export const competitors: CompetitorData[] = [
  {
    slug: 'link-whisper',
    name: 'Link Whisper',
    tagline: 'The internal linking tool that works on every website',
    heroSubhead:
      'Link Whisper is a WordPress-only plugin — if your site runs on anything else, you\'re out of luck. Linki works on any website, requires zero installation, and gets you up and running in seconds.',
    verdict:
      'Link Whisper is a solid choice if you\'re on WordPress and comfortable with plugins. But if you\'re on Webflow, Shopify, a custom CMS, or just don\'t want to install yet another plugin, Linki gives you the same AI-powered internal linking without the platform lock-in — and with a free tier to get started.',
    tableRows: [
      { feature: 'Platform support',         linki: 'Any website',      competitor: 'WordPress only' },
      { feature: 'Install required',          linki: false,              competitor: true },
      { feature: 'AI suggestions',            linki: true,               competitor: true },
      { feature: 'One-click implementation',  linki: true,               competitor: true },
      { feature: 'Session saving',            linki: true,               competitor: false },
      { feature: 'CSV export',                linki: true,               competitor: false },
      { feature: 'Free tier',                 linki: true,               competitor: false },
      { feature: 'Pricing model',             linki: 'Monthly flat',     competitor: 'One-time / annual' },
    ],
    whyLinki: [
      {
        icon: '🌐',
        title: 'Works on any platform',
        body: 'Webflow, Shopify, Ghost, custom-built — if it has pages, Linki can analyse it. No WordPress dependency, no plugin approval process, no compatibility worries.',
      },
      {
        icon: '⚡',
        title: 'Zero installation',
        body: 'Nothing to install, nothing to configure, no API key required. Paste your URL, hit analyse, and get AI suggestions in under a minute.',
      },
      {
        icon: '🔖',
        title: 'Save and resume sessions',
        body: 'Pro users can save analysis sessions and pick up exactly where they left off. Ideal for larger sites where you work through opportunities over multiple sittings.',
      },
      {
        icon: '📊',
        title: 'CSV export included',
        body: 'Download your full link opportunity report as CSV to share with clients, import into spreadsheets, or feed into your own workflows.',
      },
    ],
    competitorEdge: [
      'In-editor link insertion directly inside the WordPress post editor',
      'Auto-linking rules that automatically add links as you publish new content',
      'Orphaned page detection built into the dashboard',
    ],
    bottomLine:
      'If you run a WordPress site and want links inserted directly from your editor without leaving the CMS, Link Whisper is well-suited for that workflow. It\'s a mature plugin with a loyal user base for good reason.\n\nBut if you\'re not on WordPress — or you simply don\'t want the overhead of a plugin install — Linki gives you AI-powered internal link suggestions for any website, completely in the browser. The free tier lets you start without a credit card, and the flat monthly pricing means no surprises as your site grows.\n\nChoose Linki if you value platform flexibility and a clean, no-install experience. Choose Link Whisper if you\'re all-in on WordPress and want deep CMS integration.',
  },
  {
    slug: 'linkstorm',
    name: 'LinkStorm',
    tagline: 'Simpler internal linking without the JavaScript snippet',
    heroSubhead:
      'LinkStorm requires a JavaScript snippet on every page of your site and has no free tier. Linki requires nothing installed, starts completely free, and works on any website out of the box.',
    verdict:
      'LinkStorm is a capable tool for teams who want a persistent tracking layer on their site. But it requires ongoing technical setup and charges from day one. Linki is faster to start, works without touching your site\'s code, and lets you try AI-powered suggestions before paying anything.',
    tableRows: [
      { feature: 'Install required',         linki: false,              competitor: 'JS snippet on every page' },
      { feature: 'Free tier',                 linki: true,               competitor: false },
      { feature: 'AI suggestions',            linki: true,               competitor: true },
      { feature: 'GSC integration',           linki: false,              competitor: true },
      { feature: 'Session saving',            linki: true,               competitor: false },
      { feature: 'Cross-site linking',        linki: false,              competitor: true },
      { feature: 'Monthly billing',           linki: true,               competitor: true },
      { feature: 'Pricing entry point',       linki: 'Free',             competitor: 'Paid from day one' },
    ],
    whyLinki: [
      {
        icon: '🚫',
        title: 'No snippet to install',
        body: 'Linki crawls your site directly — there\'s nothing to add to your `<head>` tag, no third-party JavaScript running on your pages, and no developer required to get started.',
      },
      {
        icon: '🆓',
        title: 'Genuinely free to start',
        body: 'Analyse up to 10 URLs per scan and explore internal link suggestions with no credit card required. Upgrade only when you\'re ready for more scale.',
      },
      {
        icon: '🤖',
        title: 'AI-powered suggestions',
        body: 'Linki uses Google Gemini to generate contextually relevant anchor text and link target recommendations — not just keyword matching.',
      },
      {
        icon: '🔖',
        title: 'Session saving',
        body: 'Save your analysis progress and return to it later. Great for large sites where you work through link opportunities over several sessions.',
      },
    ],
    competitorEdge: [
      'Google Search Console integration for traffic-informed linking decisions',
      'Cross-site and multi-domain linking support',
      'Visual link map showing the full internal link graph',
    ],
    bottomLine:
      'LinkStorm suits teams who want their internal linking tool tightly integrated with Google Search Console data and who need to manage links across multiple domains from one dashboard. The visual link map is a genuine differentiator for larger sites.\n\nLinki takes a simpler approach: no snippet, no GSC connection required, just paste your URL and get AI suggestions instantly. It\'s the better fit if you want to act fast, keep setup minimal, and not commit budget before you\'ve seen the value.\n\nChoose Linki if you\'re starting out or value zero-friction setup. Choose LinkStorm if GSC integration and cross-domain linking are non-negotiables for your workflow.',
  },
  {
    slug: 'inlinks',
    name: 'InLinks',
    tagline: 'AI-powered internal linking without the enterprise complexity',
    heroSubhead:
      'InLinks is a sophisticated enterprise platform starting at $49/month with a steep learning curve. Linki gives you AI-powered internal link suggestions with zero setup and a free tier — no knowledge graph required.',
    verdict:
      'InLinks is genuinely powerful for enterprise SEOs who need entity optimisation, schema automation, and continuous monitoring at scale. But for most SEOs who just need solid internal linking suggestions, it\'s expensive and complex to start. Linki gets you AI suggestions in under a minute with no commitment.',
    tableRows: [
      { feature: 'Install required',        linki: false,             competitor: 'JS snippet required' },
      { feature: 'Pricing entry point',     linki: 'Free',            competitor: '$49/month' },
      { feature: 'AI suggestions',          linki: true,              competitor: true },
      { feature: 'Schema markup',           linki: false,             competitor: true },
      { feature: 'Knowledge graph',         linki: false,             competitor: true },
      { feature: 'Session saving',          linki: true,              competitor: false },
      { feature: 'CSV export',              linki: true,              competitor: true },
      { feature: 'Learning curve',          linki: 'Low',             competitor: 'High' },
    ],
    whyLinki: [
      {
        icon: '⚡',
        title: 'Start in 60 seconds',
        body: 'No snippet to install, no onboarding call, no configuration wizard. Enter your URL and get AI link suggestions immediately — no prior knowledge of entity SEO required.',
      },
      {
        icon: '💰',
        title: 'Fraction of the cost',
        body: 'InLinks starts at $49/month. Linki\'s free tier is genuinely useful and the paid plans start at a fraction of that price — making it accessible for solo SEOs and small agencies alike.',
      },
      {
        icon: '🎯',
        title: 'Focused on internal linking',
        body: 'Linki does one thing and does it well. You\'re not paying for schema generation or content briefs you don\'t need — just clean, actionable internal link suggestions.',
      },
      {
        icon: '🔖',
        title: 'Save sessions, export CSV',
        body: 'Pro users can save analysis sessions and export link opportunities as CSV. Perfect for incorporating Linki into existing SEO workflows and client reporting.',
      },
    ],
    competitorEdge: [
      'Deep entity SEO analysis and knowledge graph construction',
      'Automated schema markup generation across your entire site',
      'Continuous monitoring and automatic re-optimisation as content changes',
    ],
    bottomLine:
      'InLinks is a serious enterprise tool for teams who have moved beyond basic internal linking into entity SEO, schema automation, and continuous content monitoring. If that\'s where you are, it\'s worth the investment and the learning curve.\n\nBut for the majority of SEOs — agency teams, in-house SEOs, site owners — the complexity and price of InLinks is unnecessary. Linki covers the internal linking use case thoroughly: AI-powered suggestions, session saving, CSV export, and support for any website, all at a price point that makes sense.\n\nChoose Linki if you want fast, practical internal linking without enterprise overhead. Choose InLinks if entity SEO and schema automation are central to your strategy.',
  },
  {
    slug: 'linkboss',
    name: 'LinkBoss',
    tagline: 'Predictable pricing. No credits. No WordPress required.',
    heroSubhead:
      'LinkBoss is WordPress-only and uses a credit-based pricing model that escalates fast as your site grows. Linki is platform-agnostic with flat monthly pricing — no credit burn, no surprises.',
    verdict:
      'LinkBoss offers impressive AI features for WordPress users, including auto-generated linking paragraphs and topic cluster tools. But if you\'re not on WordPress, or if credit-based pricing makes budgeting unpredictable, Linki offers a simpler, flatter alternative that works everywhere.',
    tableRows: [
      { feature: 'Platform support',         linki: 'Any website',     competitor: 'WordPress only' },
      { feature: 'Pricing model',             linki: 'Flat monthly',    competitor: 'Credit-based' },
      { feature: 'AI suggestions',            linki: true,              competitor: true },
      { feature: 'Auto-generates content',    linki: false,             competitor: true },
      { feature: 'Topic clusters',            linki: false,             competitor: true },
      { feature: 'Session saving',            linki: true,              competitor: false },
      { feature: 'CSV export',                linki: true,              competitor: false },
      { feature: 'Free tier',                 linki: true,              competitor: false },
    ],
    whyLinki: [
      {
        icon: '🌐',
        title: 'Any platform, any CMS',
        body: 'Linki works on Webflow, Shopify, Ghost, custom builds — anything with pages. You\'re not locked into WordPress, and you don\'t need a plugin installed.',
      },
      {
        icon: '💳',
        title: 'Flat pricing, no credit burn',
        body: 'Linki charges a fixed monthly fee regardless of how many pages you analyse. No per-credit costs, no usage spikes, no budget surprises at the end of the month.',
      },
      {
        icon: '🔖',
        title: 'Session saving',
        body: 'Save your in-progress analysis and return later. Perfect for larger sites where you work through internal linking opportunities over multiple sessions.',
      },
      {
        icon: '📊',
        title: 'Export to CSV',
        body: 'Download all link opportunities as a CSV file for client reporting, team collaboration, or importing into project management tools.',
      },
    ],
    competitorEdge: [
      'Auto-generates contextual linking paragraphs to insert around new links',
      'Topic cluster builder for structuring pillar and supporting content',
      'Deep semantic analysis of content relationships within WordPress',
    ],
    bottomLine:
      'LinkBoss is a feature-rich choice for WordPress power users who want AI to not just suggest links but also generate the surrounding content. If you\'re managing a large WordPress blog and want maximum automation, it\'s worth evaluating.\n\nBut LinkBoss\'s credit model means costs scale with usage in ways that are hard to predict, and the WordPress-only restriction rules it out for many modern sites. Linki is the better fit if you want consistent monthly pricing, platform flexibility, and a free tier to get started without commitment.\n\nChoose Linki if you\'re on a non-WordPress platform or want predictable, flat pricing. Choose LinkBoss if you\'re all-in on WordPress and want auto-generated linking content.',
  },
  {
    slug: 'seojuice',
    name: 'SEOJuice',
    tagline: 'Focused internal linking with full user control',
    heroSubhead:
      'SEOJuice automates broadly across multiple SEO tasks in a set-and-forget model. Linki focuses specifically on internal linking and gives you full visibility and control over every suggestion — nothing happens without your approval.',
    verdict:
      'SEOJuice suits teams who want broad SEO automation with minimal hands-on involvement. Linki is the better choice if you want to stay in control of your internal linking strategy, understand exactly why each link is suggested, and implement changes deliberately rather than automatically.',
    tableRows: [
      { feature: 'Platform support',         linki: 'Any website',     competitor: 'Any website' },
      { feature: 'Install required',          linki: false,             competitor: 'JS snippet required' },
      { feature: 'User control',              linki: 'Full control',    competitor: 'Automated / limited control' },
      { feature: 'Internal linking focus',    linki: true,              competitor: false },
      { feature: 'AI suggestions',            linki: true,              competitor: true },
      { feature: 'Session saving',            linki: true,              competitor: false },
      { feature: 'CSV export',                linki: true,              competitor: false },
      { feature: 'White-label',               linki: false,             competitor: true },
    ],
    whyLinki: [
      {
        icon: '🎯',
        title: 'Built for internal linking',
        body: 'Linki is purpose-built for internal linking — not a feature inside a broader SEO platform. That focus means a sharper, more useful experience for the specific task of finding and implementing internal links.',
      },
      {
        icon: '👁️',
        title: 'Full visibility into every suggestion',
        body: 'Every link Linki suggests comes with the source page, target page, and recommended anchor text clearly shown. You review and approve — nothing is implemented behind your back.',
      },
      {
        icon: '🚫',
        title: 'No snippet on your site',
        body: 'Linki crawls your pages directly. There\'s no JavaScript running on your site, no ongoing tracking, and no third-party code to maintain or worry about.',
      },
      {
        icon: '📊',
        title: 'Export and own your data',
        body: 'Download your full link opportunity report as CSV. Your analysis is yours — take it anywhere, share it with clients, or store it in your own systems.',
      },
    ],
    competitorEdge: [
      'Broader SEO automation beyond internal linking (meta, content, etc.)',
      'White-label reporting for agencies managing multiple clients',
      'Fully automated, set-and-forget approach requiring minimal ongoing attention',
    ],
    bottomLine:
      'SEOJuice is a good fit for agencies or site owners who want a wide-ranging SEO automation layer running quietly in the background. The white-label capability makes it appealing for agencies who want to deliver SEO services without ongoing manual effort.\n\nLinki is intentionally different: it gives you focused internal link suggestions that you review and implement yourself. That means more control, more transparency, and a clearer picture of what\'s changing on your site and why. It\'s the better fit for SEOs who want to stay in the driver\'s seat.\n\nChoose Linki if you value full control and a focused internal linking workflow. Choose SEOJuice if you want broad, automated SEO across multiple dimensions with minimal hands-on involvement.',
  },
]

export function getCompetitor(slug: string): CompetitorData | undefined {
  return competitors.find((c) => c.slug === slug)
}
