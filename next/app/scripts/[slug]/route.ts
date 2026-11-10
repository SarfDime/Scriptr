import { NextResponse } from 'next/server'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScript } from '@/lib/api/scripts-api'

/**
 * The old script address. Scripts have no catalog page: one belongs to a study,
 * and the study's site owns it, so this is an address that only forwards —
 * an HTTP route handler, not a page, deliberately outside the catalog tree.
 *
 * It exists for links minted before the move (bookmarks, shared URLs, any
 * surface that still knows only a slug): they land here and continue to
 * `/study/[siteSlug]/scripts/[slug]`. A study without a site handle has nowhere
 * to forward to, so the script is not reachable rather than rendered here.
 */
export const dynamic = 'force-dynamic'

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const script = await getScript(slug).catch(() => null)

  const siteSlug = script?.subject?.study?.site_slug ?? null
  if (!script || !siteSlug) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.redirect(
    new URL(
      getAcademicPath({
        type: 'script',
        scriptSlug: script.slug,
        siteSlug,
      }),
      request.url
    ),
    308
  )
}
