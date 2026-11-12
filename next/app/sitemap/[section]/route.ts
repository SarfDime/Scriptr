import { NextResponse } from 'next/server'
import { buildSitemapSection } from '@/lib/sitemap-entries'
import { hasSiteOrigin, listSitemapSections } from '@/lib/sitemap-sections'
import { SITEMAP_CONTENT_TYPE, toSitemapUrlsetXml } from '@/lib/sitemap-xml'

/**
 * One prerendered file per catalog section (see `listSitemapSections`), served
 * at `/sitemap/<id>.xml`. A route handler rather than a `sitemap.ts` metadata
 * route because `/sitemap.xml` belongs to the index (`app/sitemap.xml`), and
 * Next refuses to serve both a route and a metadata file at one path.
 */
export const dynamic = 'force-static'
export const revalidate = false

const XML_SUFFIX = '.xml'

export const generateStaticParams = async (): Promise<
  Array<{ section: string }>
> =>
  (await listSitemapSections()).map((section) => ({
    section: `${section.id}${XML_SUFFIX}`,
  }))

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named GET/etc.
export async function GET(
  _request: Request,
  context: { params: Promise<{ section: string }> }
) {
  const { section } = await context.params

  if (!hasSiteOrigin() || !section.endsWith(XML_SUFFIX)) {
    return new NextResponse(null, { status: 404 })
  }

  const entries = await buildSitemapSection(
    section.slice(0, -XML_SUFFIX.length)
  )

  return new NextResponse(toSitemapUrlsetXml(entries), {
    headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
  })
}
