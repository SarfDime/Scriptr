import { NextResponse } from 'next/server'
import { SITEMAP_CONTENT_TYPE, toSitemapIndexXml } from '@/lib/sitemap-xml'
import { studySiteOrigin } from '@/lib/study-origin'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import { listStudySitemapSections } from '@/lib/study-sitemap'

/**
 * A study host's `/sitemap.xml`, served because the host's own request is
 * rewritten onto this path. Each study publishes the pages it serves, on its own
 * host, and the catalog publishes the rest — one address per page, which is the
 * reason a study has a hostname at all.
 *
 * Rendered on first request and held, like the study's pages: the content behind
 * it only changes on publish.
 */
export const revalidate = false

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> }
) {
  const { siteSlug } = await context.params
  await getStudySiteOrNotFound(siteSlug)

  const sections = await listStudySitemapSections(siteSlug)
  const origin = studySiteOrigin(siteSlug)
  if (sections.length === 0 || !origin) {
    return new NextResponse(null, { status: 404 })
  }

  const xml = toSitemapIndexXml(
    sections.map((section) =>
      new URL(`/sitemap/${section.id}.xml`, origin).toString()
    )
  )

  return new NextResponse(xml, {
    headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
  })
}
