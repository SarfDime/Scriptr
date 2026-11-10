import { Hono } from 'hono'
import { SITEMAP_SECRET_HEADER } from '../../../shared/config/access'
import type { ScriptSitemapEntry } from '../../../shared/types/scripts.types'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { clientIp, databaseErrorResponse } from '../lib/request'
import { matchesSecret } from '../lib/secret'
import { createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

/**
 * The sitemap's script list, and the only route outside the admin surface that
 * trusts a shared secret.
 *
 * The secret is scoped to this one path and lives only in the Next build, so it
 * cannot reach a browser. It exists to stop the route being used as a scrape
 * endpoint, not to defend the database: the payload is two public columns.
 */
const sitemap = new Hono<HonoEnv>()

/** `/sitemap.xml` is prerendered at build time and never revalidated, so the
 * Next side reads this once per deployment and only `main` and `staging` deploy.
 * Ten a day leaves room for redeploys and retries; a caller that is not a build
 * runs out almost immediately. */
const dailyLimiter = createRateLimiter({
  limit: 10,
  windowMs: 24 * 60 * 60 * 1000,
  countBlocked: true,
})

/** A build should make one call; this stops a retry loop from spending the
 * daily allowance in a few seconds. */
const burstLimiter = createRateLimiter({
  limit: 2,
  windowMs: 60 * 1000,
  countBlocked: true,
})

/** Every script's address, for the sitemap.
 *
 * `GET /scripts` is admin-only and paginated, so a crawler-facing list has to
 * come from here: it has to be complete, but it has no business carrying files,
 * comment counts or author profiles, so it selects two columns and nothing
 * else. */
sitemap.get('/scripts', async (c) => {
  const expected = c.env.SITEMAP_SECRET
  const provided = c.req.header(SITEMAP_SECRET_HEADER)

  if (!expected || !provided || !matchesSecret(expected, provided)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const ip = clientIp(c)
  if (dailyLimiter(ip) || burstLimiter(ip)) {
    return c.json(
      { error: 'Too many sitemap reads. The list is cached upstream.' },
      429
    )
  }

  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select('slug, updated_at, subject:subjects(study:studies(site_slug))')
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)

  // The page belongs to the study's site, so the sitemap advertises that
  // address rather than the catalog one that would redirect to it.
  return c.json<Array<ScriptSitemapEntry>>(
    data.map((row) => ({
      slug: row.slug,
      updated_at: row.updated_at,
      study_site_slug: row.subject?.study?.site_slug ?? null,
    }))
  )
})

export default sitemap
