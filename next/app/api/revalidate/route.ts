import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/** Called by the Hono API after a script is created, updated, or deleted so
 * the cached fetches tagged with the affected scripts:* tags are dropped.
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
    // 'max' fully purges the tag rather than shortening its cache-life window.
    revalidateTag(tag, 'max')
  }

  return NextResponse.json({ revalidated: tags })
}
