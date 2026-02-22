import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { BlogPosts } from './collections/BlogPosts'
import { VsPages } from './collections/VsPages'
import { PageHome } from './globals/PageHome'
import { PageFeatures } from './globals/PageFeatures'
import { PagePricing } from './globals/PagePricing'
import { PagePrivacy } from './globals/PagePrivacy'
import { PageTerms } from './globals/PageTerms'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, BlogPosts, VsPages],
  globals: [PageHome, PageFeatures, PagePricing, PagePrivacy, PageTerms, SiteSettings],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://getlinki.app',
    'http://localhost:5173',
  ],
  csrf: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://getlinki.app',
    'http://localhost:5173',
  ],
})
