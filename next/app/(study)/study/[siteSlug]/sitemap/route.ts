import { NextResponse } from 'next/server'
import { SITEMAP_CONTENT_TYPE, toSitemapIndexXml } from '@/lib/sitemap-xml'
import { studySiteOrigin } from '@/lib/study-origin'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import { listStudySitemapSections, listStudySites } from '@/lib/study-sitemap'

/**
 * A study host's `/sitemap.xml`, served because the host's own request is
 * rewritten onto this path. Each study publishes the pages it serves, on its own
 * host, and the catalog publishes the rest — one address per page, which is the
 * reason a study has a hostname at all.
 *
 * Prerendered per study at build (see `generateStaticParams`) and held until the
 * next deploy, like the catalog's own sitemap — a crawl must never pay for a
 * sitemap API read.
 */
export const revalidate = false

/** Without this the route is prerendered once with `-` and every study host
 * inherits that placeholder — an empty 404. It is why this file is
 * `sitemap/route.ts` and the host's `/sitemap.xml` is rewritten onto it: Next
 * ignores `generateStaticParams` on a segment that ends in a dot. */
export const generateStaticParams = async (): Promise<
  Array<{ siteSlug: string }>
> => (await listStudySites()).map((siteSlug) => ({ siteSlug }))

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
