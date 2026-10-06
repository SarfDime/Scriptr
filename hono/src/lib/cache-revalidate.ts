import { scriptMutationTags } from '../../../shared/config/cache-tags'
import type { HonoEnv } from '../types/env.types'

/** Best-effort call to the Next.js revalidate route so cached public reads
 * pick up their backing-data changes. Failures are logged, not thrown, so a
 * revalidation hiccup never fails the underlying mutation.
 */
export async function revalidateCacheTags(
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
    console.error('Failed to revalidate cache tags', error)
  }
}

export { scriptMutationTags }
