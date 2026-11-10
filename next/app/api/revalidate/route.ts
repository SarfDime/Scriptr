import {
  REVALIDATE_SIGNATURE_HEADER,
  REVALIDATE_TIMESTAMP_HEADER,
} from '@shared/config/access'
import { createRateLimiter } from '@shared/utils/rate-limit'
import { verifyRequest } from '@shared/utils/request-signature'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/client-ip'

/**
 * Called by the Hono API after a script is created, updated, or deleted so the
 * cached fetches tagged with the affected scripts:* tags are expired.
 *
 * The call is signed, not secret-bearing: the API sends
 * `HMAC-SHA256(${timestamp}.${body})` and this route verifies it, so a captured
 * request stops working after the clock-skew window instead of being replayable
 * forever. A signature check is also cheap enough to run before the rate limit,
 * which then only throttles callers that already proved they hold the secret.
 *
 * `{ expire: 0 }` is deliberate. A bare `'max'` profile is stale-while-
 * revalidate: the first request after a mutation is still served the old data
 * while the refresh runs in the background, so a deleted script (or an old
 * title) stays visible until a second load. The caller here is the external
 * Hono API, where `updateTag` isn't available, and the Next.js docs prescribe
 * `{ expire: 0 }` for that case: stale data is never served and the next
 * request blocks on a fresh fetch.
 */
/** The signature covers the raw body, so it has to be read before anything is
 * verified. Cap it first: an unauthenticated caller could otherwise make this
 * route buffer an arbitrarily large payload per request. */
const MAX_BODY_BYTES = 8 * 1024

const revalidateLimiter = createRateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  countBlocked: true,
})

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }

  const secret = process.env.REVALIDATE_SECRET
  const body = await request.text()

  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }

  if (!secret) {
    return NextResponse.json(
      { error: 'Revalidation is not configured' },
      { status: 503 }
    )
  }

  const isAuthentic = await verifyRequest({
    secret,
    timestamp: request.headers.get(REVALIDATE_TIMESTAMP_HEADER) ?? '',
    signature: request.headers.get(REVALIDATE_SIGNATURE_HEADER) ?? '',
    body,
  })

  if (!isAuthentic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (revalidateLimiter(clientIp(request))) {
    return NextResponse.json(
      { error: 'Too many revalidation requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const payload = ((): unknown => {
    try {
      return JSON.parse(body)
    } catch {
      return null
    }
  })()
  const tags = (payload as { tags?: unknown } | null)?.tags

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
