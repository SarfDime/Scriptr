import { scriptMutationTags } from '../../../shared/config/cache-tags'
import type { HonoEnv } from '../types/env.types'

/** Best-effort call to the Next.js revalidate route so cached script fetches
 * pick up create/update/delete changes. Failures are logged, not thrown, so a
 * revalidation hiccup never fails the underlying script mutation.
 */
export async function revalidateScriptTags(
  env: HonoEnv['Bindings'],
  tags: Array<string>
) {
  const revalidateUrl = env.NEXT_REVALIDATE_URL
  const secret = env.REVALIDATE_SECRET

  if (!(revalidateUrl && secret) || tags.length === 0) return

  try {
    await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ tags }),
    })
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: surfacing revalidation failures for ops visibility
    console.error('Failed to revalidate script cache tags', error)
  }
}

export { scriptMutationTags }
