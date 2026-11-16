import {
  REVALIDATE_SIGNATURE_HEADER,
  REVALIDATE_TIMESTAMP_HEADER,
} from '../../../shared/config/access'
import { scriptMutationTags } from '../../../shared/config/cache-tags'
import { signRequest } from '../../../shared/utils/request-signature'
import type { HonoEnv } from '../types/env.types'

/** The value shipped in `.env.example`. Using it in production means anyone
 * with the repository can expire the web cache, so it is called out below. */
const DEV_REVALIDATE_SECRET = 'development_secret_key'

/** Logs through the API logger where possible. A cache-revalidation failure
 * must be visible: a stale public feed is otherwise indistinguishable from a
 * healthy one. */
function reportFailure(message: string, detail?: unknown) {
  // biome-ignore lint/suspicious/noConsole: no Hono context in this helper
  console.error(message, detail ?? '')
}

/**
 * Best-effort call to the Next.js revalidate route so cached public reads
 * pick up their backing-data changes. Failures are logged, not thrown, so a
 * revalidation hiccup never fails the underlying mutation — but they are
 * never silent: an unconfigured or rejected webhook shows up in the logs.
 */
export async function revalidateCacheTags(
  env: HonoEnv['Bindings'],
  tags: Array<string>
) {
  if (tags.length === 0) return

  const revalidateUrl = env.NEXT_REVALIDATE_URL
  const secret = env.REVALIDATE_SECRET

  if (!(revalidateUrl && secret)) {
    reportFailure(
      'Cache revalidation skipped: NEXT_REVALIDATE_URL and REVALIDATE_SECRET must both be set'
    )
    return
  }

  if (env.NODE_ENV === 'production' && secret === DEV_REVALIDATE_SECRET) {
    reportFailure(
      'Cache revalidation is using the default development secret in production; rotate REVALIDATE_SECRET on both projects'
    )
  }

  try {
    // The secret never travels: the web app verifies this signature over the
    // body and a timestamp, so a captured request expires instead of being
    // replayable forever.
    const body = JSON.stringify({ tags })
    const timestamp = String(Date.now())
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [REVALIDATE_TIMESTAMP_HEADER]: timestamp,
        [REVALIDATE_SIGNATURE_HEADER]: await signRequest(
          secret,
          timestamp,
          body
        ),
      },
      body,
    })

    if (!response.ok) {
      reportFailure(
        `Cache revalidation failed with status ${response.status} for ${revalidateUrl}`,
        tags
      )
    }
  } catch (error) {
    reportFailure('Failed to reach the cache revalidation endpoint', error)
  }
}

export { scriptMutationTags }
