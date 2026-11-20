import { NextResponse } from 'next/server'
import { hasSiteOrigin, listSitemapSections } from '@/lib/sitemap-sections'
import { SITEMAP_CONTENT_TYPE, toSitemapIndexXml } from '@/lib/sitemap-xml'
import { websiteDomain } from '@/sanity/env'

/**
 * The catalog host's sitemap index. The protocol wants one entry point a
 * crawler can submit, so this lists each section in `app/sitemap/[section]`.
 * It owns `/sitemap.xml` outright — the sections are route handlers rather than
 * a `sitemap.ts` metadata route because Next refuses to serve a route and a
 * metadata file at the same path.
 *
 * A study publishes its own index on its own host
 * (`app/(study)/study/[siteSlug]/sitemap.xml`), and that host's `/sitemap.xml`
 * never reaches this file.
 */

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function GET() {
  if (!hasSiteOrigin()) {
    return new NextResponse(null, { status: 404 })
  }

  const sections = await listSitemapSections()
  const xml = toSitemapIndexXml(
    sections.map((section) =>
      new URL(`/sitemap/${section.id}.xml`, websiteDomain).toString()
    )
  )

  return new NextResponse(xml, {
    headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
  })
}
