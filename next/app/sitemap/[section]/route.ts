import { NextResponse } from 'next/server'
import { buildSitemapSection, type SitemapEntry } from '@/lib/sitemap-entries'
import { hasSiteOrigin, listSitemapSections } from '@/lib/sitemap-sections'

/**
 * One prerendered file per section (see `listSitemapSections`), served at
 * `/sitemap/<id>.xml`. A route handler rather than a `sitemap.ts` metadata
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

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const toEntryXml = (entry: SitemapEntry): string => {
  const lastModified = entry.lastModified
    ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
    : ''

  return `  <url><loc>${escapeXml(entry.url)}</loc>${lastModified}</url>`
}

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(toEntryXml).join('\n')}
</urlset>
`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
