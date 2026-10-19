import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/** Called by the Hono API after a script is created, updated, or deleted so
 * the cached fetches tagged with the affected scripts:* tags are expired.
 *
 * `{ expire: 0 }` is deliberate. A bare `'max'` profile is stale-while-
 * revalidate: the first request after a mutation is still served the old data
 * while the refresh runs in the background, so a deleted script (or an old
 * title) stays visible until a second load. The caller here is the external
 * Hono API, where `updateTag` isn't available, and the Next.js docs prescribe
 * `{ expire: 0 }` for that case: stale data is never served and the next
 * request blocks on a fresh fetch.
 */
// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret')

  if (
    !process.env.REVALIDATE_SECRET ||
    secret !== process.env.REVALIDATE_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const tags = body?.tags

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    return NextResponse.json(
      { error: 'tags must be a string array' },
      { status: 400 }
    )
  }

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 })
  }

  return NextResponse.json({ revalidated: tags })
}
