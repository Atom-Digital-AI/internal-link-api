// frontend/src/services/cms.ts

const CMS_URL = import.meta.env.VITE_CMS_URL || 'http://localhost:3001'

async function fetchCms<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}/api${path}`)
  if (!res.ok) throw new Error(`CMS fetch failed: ${res.status} ${path}`)
  return res.json() as Promise<T>
}

// ─── Globals ──────────────────────────────────────────────────────────────

export async function getGlobal<T>(slug: string): Promise<T> {
  return fetchCms<T>(`/globals/${slug}`)
}

// ─── Blog posts ───────────────────────────────────────────────────────────

export interface CmsBlogPostSummary {
  id: string
  slug: string
  title: string
  excerpt?: string
  coverImage?: { url: string; alt?: string }
  publishedAt?: string
  createdAt: string
}

export interface CmsBlogPostDetail extends CmsBlogPostSummary {
  body: unknown  // Lexical rich text node — rendered via @payloadcms/richtext-lexical/react
  metaTitle?: string
  metaDescription?: string
}

export async function getCmsBlogPosts(): Promise<CmsBlogPostSummary[]> {
  const data = await fetchCms<{ docs: CmsBlogPostSummary[] }>(
    '/blog-posts?where[published][equals]=true&sort=-publishedAt&limit=50'
  )
  return data.docs
}

export async function getCmsBlogPost(slug: string): Promise<CmsBlogPostDetail | null> {
  const data = await fetchCms<{ docs: CmsBlogPostDetail[] }>(
    `/blog-posts?where[slug][equals]=${encodeURIComponent(slug)}&where[published][equals]=true&limit=1`
  )
  return data.docs[0] ?? null
}

// ─── VS pages ────────────────────────────────────────────────────────────

export interface CmsVsPage {
  id: string
  slug: string
  name: string
  tagline?: string
  heroSubhead?: string
  verdict?: string
  tableRows?: { feature: string; linki: string; competitor: string }[]
  whyLinki?: { icon: string; title: string; body: string }[]
  competitorEdge?: { point: string }[]
  bottomLine?: string
  metaTitle?: string
  metaDescription?: string
}

export async function getCmsVsPage(slug: string): Promise<CmsVsPage | null> {
  const data = await fetchCms<{ docs: CmsVsPage[] }>(
    `/vs-pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`
  )
  return data.docs[0] ?? null
}
