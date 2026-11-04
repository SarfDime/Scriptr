import 'server-only'

import { SITEMAP_SECRET_HEADER } from '@shared/config/access'
import { apiRoutes } from '@shared/config/api-routes'
import type { ScriptSitemapEntry } from '@shared/types/scripts.types'
import { nextLogs } from '@/lib/logger'
import { apiFetch } from './next-api'

/**
 * The one place in `next/` that holds the sitemap route's secret.
 *
 * `import 'server-only'` makes the build fail if a Client Component, hook or any
 * module they import ever pulls this file in, so the secret cannot reach browser
 * code. It is read here rather than from `config/env.ts` because that module is
 * shared with client code.
 *
 * The secret is scoped to a single read route, so it grants nothing beyond a
 * list of public slugs. Never give it a `NEXT_PUBLIC_` prefix.
 */
const SITEMAP_SECRET = process.env.SITEMAP_SECRET ?? ''

/**
 * Every script's address, for the sitemap. `GET /api/scripts` is admin-only and
 * paginated, and a crawler list only needs the slug and the update time.
 *
 * `/sitemap.xml` is prerendered at build time and never revalidated (see
 * `app/sitemap.ts`), so this runs once per deployment — which is why the route's
 * daily limit can be as low as it is.
 *
 * `null` when the read fails or the secret is missing — the sitemap then leaves
 * its script section out rather than publishing an empty one.
 */
export const getScriptSitemapEntries = async () => {
  if (!SITEMAP_SECRET) {
    nextLogs({
      message:
        'SITEMAP_SECRET is not set; the sitemap will omit every script URL.',
      logLevel: 'warn',
    })
    return null
  }

  try {
    return await apiFetch<Array<ScriptSitemapEntry>>(
      apiRoutes.sitemap.scripts,
      { headers: { [SITEMAP_SECRET_HEADER]: SITEMAP_SECRET } }
    )
  } catch (error) {
    nextLogs({
      message: 'The script sitemap entries could not be read.',
      logLevel: 'warn',
      error,
    })
    return null
  }
}
