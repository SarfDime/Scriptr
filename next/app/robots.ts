import type { MetadataRoute } from 'next'
import { websiteDomain } from '@/sanity/env'

/**
 * A calendar's period lives in the URL and every period links to the one before
 * and the one after it, so a crawler that follows them never reaches the end —
 * and each step is a full render the CDN cannot reuse. `/calendar` is therefore
 * closed to every crawler, in both shapes a study answers at (its own host and
 * the catalog path that redirects there).
 *
 * AI and scraper agents are closed out of the whole site: they spent the
 * function CPU budget on the calendar without reading for anyone.
 */
const CALENDAR_PATHS = [
  '/calendar',
  '/mk/calendar',
  '/study/*/calendar',
  '/mk/study/*/calendar',
]

/** Private surfaces: admin has its own session + TOTP gate, so a crawler has
 * nothing to index and its links only lead deeper in. `/admin` also covers
 * every nested admin path. */
const ADMIN_PATHS = ['/admin', '/mk/admin']

const AI_AND_SCRAPER_AGENTS = [
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'MJ12bot',
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'PetalBot',
  'DataForSeoBot',
  'ImagesiftBot',
  'Barkrowler',
  'serpstatbot',
  'Diffbot',
]

const sitemap = websiteDomain
  ? new URL('/sitemap.xml', websiteDomain).toString()
  : undefined

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_AND_SCRAPER_AGENTS, disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [...CALENDAR_PATHS, ...ADMIN_PATHS],
      },
    ],
    ...(sitemap ? { sitemap } : {}),
  }
}
