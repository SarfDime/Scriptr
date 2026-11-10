import { SANITY_TYPE_TAGS } from '@shared/config/cache-tags'
import { createRateLimiter } from '@shared/utils/rate-limit'
import { matchesSecret } from '@shared/utils/request-signature'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/client-ip'
import { nextLogs } from '@/lib/logger'

/**
 * Called by a Sanity publish webhook so an editorial edit reaches readers
 * without a redeploy. Every Sanity read carries the tags of the document types
 * it renders (see `SANITY_TYPE_TAGS`), so one publish invalidates the pages that
 * read that type instead of the whole dataset.
 *
 * The webhook sends a shared secret in a custom header. Sanity cannot sign a
 * request, so this is a bearer secret rather than the HMAC the API's own
 * revalidation uses; it is compared without an early exit and the route is rate
 * limited, but it should still be rotated like any other credential.
 */
const SECRET_HEADER = 'x-sanity-webhook-secret'

/** Sanity sends the whole document by default; nothing here reads that much. */
const MAX_BODY_BYTES = 4 * 1024

const revalidateLimiter = createRateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
  countBlocked: true,
})

type WebhookPayload = { _type?: unknown; _id?: unknown }

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'Sanity revalidation is not configured' },
      { status: 503 }
    )
  }

  if (!(await matchesSecret(request.headers.get(SECRET_HEADER), secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (revalidateLimiter(clientIp(request))) {
    return NextResponse.json(
      { error: 'Too many revalidation requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }

  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }

  const payload = ((): WebhookPayload | null => {
    try {
      return JSON.parse(body) as WebhookPayload
    } catch {
      return null
    }
  })()

  if (!payload) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const type = typeof payload._type === 'string' ? payload._type : null
  const id = typeof payload._id === 'string' ? payload._id : null

  // A draft is an editor's private copy, not what readers see.
  if (!type || !id || id.startsWith('drafts.')) {
    return NextResponse.json({ ignored: true })
  }

  const tag = SANITY_TYPE_TAGS[type]

  if (!tag) {
    nextLogs({
      logLevel: 'warn',
      message: `Sanity publish webhook: no cache tag for type "${type}".`,
    })
    return NextResponse.json({ ignored: true })
  }

  revalidateTag(tag, { expire: 0 })

  return NextResponse.json({ revalidated: [tag] })
}
