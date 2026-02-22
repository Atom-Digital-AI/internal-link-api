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
    tagline: 'AI link suggestions for any website — no install needed',
    heroSubhead:
      'Link Whisper is a WordPress-only plugin — if your site runs on anything else, you\'re out of luck. Linki analyses any website from the outside, with no plugin or CMS access needed. You get AI-powered link suggestions, then implement them in your own workflow.',
    verdict:
      'Link Whisper is a solid choice if you\'re on WordPress and want links inserted directly from the editor. But if you\'re on Webflow, Shopify, a custom CMS, or managing multiple client sites across different platforms, Linki lets you analyse any website without needing admin access or a plugin install. You get AI-powered suggestions and export them to implement however suits your workflow — with a free tier to get started.',
    tableRows: [
      { feature: 'Analyses any website',       linki: true,               competitor: 'WordPress only' },
      { feature: 'Install required',          linki: false,              competitor: true },
      { feature: 'CMS access needed',         linki: false,              competitor: true },
      { feature: 'In-editor link insertion',  linki: false,              competitor: true },
      { feature: 'AI suggestions',            linki: true,               competitor: true },
      { feature: 'Session saving',            linki: true,               competitor: false },
      { feature: 'CSV export',                linki: true,               competitor: false },
      { feature: 'Free tier',                 linki: true,               competitor: false },
      { feature: 'Pricing model',             linki: 'Monthly flat',     competitor: 'One-time / annual' },
    ],
    whyLinki: [
      {
        icon: '🌐',
        title: 'Analyse any website',
        body: 'Webflow, Shopify, Ghost, custom-built — if it has pages, Linki can crawl and analyse it from the outside. No WordPress dependency, no plugin install, no CMS admin access required. Ideal if you\'re an agency or consultant auditing sites across different platforms.',
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
      'If you run a WordPress site and want links inserted directly from your editor without leaving the CMS, Link Whisper is well-suited for that workflow. It\'s a mature plugin with a loyal user base for good reason.\n\nLinki takes a different approach: it analyses your site from the outside and gives you AI-powered link suggestions that you then implement yourself. That means it works on any platform — WordPress, Webflow, Shopify, custom builds — but it won\'t insert links into your CMS for you. The trade-off is flexibility: you can analyse any website without needing admin access or installing anything, which makes it particularly useful for agencies and consultants managing sites across different platforms.\n\nChoose Linki if you work across multiple platforms or want to audit sites without needing CMS access. Choose Link Whisper if you\'re all-in on WordPress and want direct in-editor link insertion.',
  },
  {
    slug: 'linkstorm',
    name: 'LinkStorm',
    tagline: 'Simpler internal linking without the JavaScript snippet',
    heroSubhead:
      'LinkStorm requires a JavaScript snippet on every page of your site and has no free tier. Linki analyses your site from the outside — nothing to install, no site access needed — and starts completely free.',
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
        body: 'Linki crawls your site from the outside — there\'s nothing to add to your `<head>` tag, no third-party JavaScript on your pages, and no developer or CMS access required. That also means you can analyse client sites or competitor sites without needing to touch their code.',
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
      'LinkStorm suits teams who want their internal linking tool tightly integrated with Google Search Console data and who need to manage links across multiple domains from one dashboard. The visual link map is a genuine differentiator for larger sites.\n\nLinki takes a different approach: it analyses your site externally, so there\'s no snippet to maintain and no site access required. That makes it particularly useful for agencies or consultants who need to audit linking opportunities across multiple client sites without requesting backend access to each one. The trade-off is you don\'t get the persistent tracking or cross-domain linking that LinkStorm offers.\n\nChoose Linki if you want zero-friction setup, especially across multiple sites you don\'t control. Choose LinkStorm if GSC integration and cross-domain linking are non-negotiables for your workflow.',
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
        body: 'No snippet to install, no onboarding call, no site access required. Enter any URL and get AI link suggestions immediately — whether it\'s your own site, a client\'s site, or a prospect you\'re pitching to.',
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
      'InLinks is a serious enterprise tool for teams who have moved beyond basic internal linking into entity SEO, schema automation, and continuous content monitoring. If that\'s where you are, it\'s worth the investment and the learning curve.\n\nBut for the majority of SEOs — agency teams, in-house SEOs, site owners — the complexity and price of InLinks is unnecessary. Linki analyses any website externally and gives you actionable link suggestions without needing a snippet installed or CMS access granted. For agencies managing multiple client sites, that means you can audit linking opportunities across your entire portfolio without onboarding each site into an enterprise platform.\n\nChoose Linki if you want fast, practical internal linking you can run on any site without setup. Choose InLinks if entity SEO and schema automation are central to your strategy.',
  },
  {
    slug: 'linkboss',
    name: 'LinkBoss',
    tagline: 'Predictable pricing. No credits. No WordPress required.',
    heroSubhead:
      'LinkBoss is WordPress-only and uses a credit-based pricing model that escalates fast as your site grows. Linki analyses any website from the outside — no plugin, no CMS access needed — with flat monthly pricing and no credit burn.',
    verdict:
      'LinkBoss offers impressive AI features for WordPress users, including auto-generated linking paragraphs and topic cluster tools. But if you\'re not on WordPress, or if credit-based pricing makes budgeting unpredictable, Linki can analyse any site from the outside and give you AI-powered suggestions without a plugin install.',
    tableRows: [
      { feature: 'Analyses any website',       linki: true,              competitor: 'WordPress only' },
      { feature: 'Install required',          linki: false,             competitor: true },
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
        title: 'Analyse any website',
        body: 'Linki crawls and analyses any website from the outside — Webflow, Shopify, Ghost, custom builds, or sites you don\'t even have admin access to. No plugin, no CMS login required. That makes it a natural fit for agencies and consultants working across multiple client platforms.',
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
      'LinkBoss is a feature-rich choice for WordPress power users who want AI to not just suggest links but also generate the surrounding content. If you\'re managing a large WordPress blog and want maximum automation, it\'s worth evaluating.\n\nBut LinkBoss\'s credit model means costs scale with usage in ways that are hard to predict, and the WordPress-only restriction rules it out for many modern sites. Linki analyses any website from the outside — no plugin, no CMS access needed — which makes it a practical choice for agencies or anyone managing sites across different platforms. The trade-off is that Linki suggests links for you to implement rather than inserting them directly.\n\nChoose Linki if you work across multiple platforms or want predictable, flat pricing. Choose LinkBoss if you\'re all-in on WordPress and want auto-generated linking content with direct insertion.',
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
      { feature: 'Analyses any website',       linki: true,              competitor: true },
      { feature: 'Install required',          linki: false,             competitor: 'JS snippet required' },
      { feature: 'CMS access needed',         linki: false,             competitor: true },
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
        body: 'Linki analyses your pages from the outside. There\'s no JavaScript running on your site, no CMS access needed, and no third-party code to maintain. You can analyse any website — your own, a client\'s, or a prospect\'s — without needing backend access.',
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
      'SEOJuice is a good fit for site owners who want a wide-ranging SEO automation layer running quietly in the background. The white-label capability and snippet-based model makes it appealing for agencies who want to deliver hands-off SEO services — though it does require installing code on each client site.\n\nLinki takes a different approach: it analyses any website from the outside and gives you focused internal link suggestions that you review and implement yourself. No snippet to install, no CMS access needed. For agencies, that means you can audit linking opportunities across your entire client portfolio without needing backend access to each site — useful for pitching new clients or running quick audits alongside your existing workflow.\n\nChoose Linki if you want full control, no-access-required analysis, and a focused internal linking workflow. Choose SEOJuice if you want broad, automated SEO with white-label reporting and don\'t mind the snippet requirement.',
  },
]

export function getCompetitor(slug: string): CompetitorData | undefined {
  return competitors.find((c) => c.slug === slug)
}
