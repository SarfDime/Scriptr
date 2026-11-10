import { NextResponse } from 'next/server'
import { hasSiteOrigin, listSitemapSections } from '@/lib/sitemap-sections'
import { websiteDomain } from '@/sanity/env'

/**
 * The index over the sections in `app/sitemap/[section]`; the protocol wants one
 * entry point a crawler can submit, so this lists each section. It owns
 * `/sitemap.xml` outright — the sections are route handlers rather than a
 * `sitemap.ts` metadata route because Next refuses to serve a route and a
 * metadata file at the same path.
 */
export const dynamic = 'force-static'
export const revalidate = false

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function GET() {
  if (!hasSiteOrigin()) {
    return new NextResponse(null, { status: 404 })
  }

  const sections = await listSitemapSections()
  const entries = sections
    .map((section) => {
      const loc = new URL(`/sitemap/${section.id}.xml`, websiteDomain)
      return `  <sitemap><loc>${loc.toString()}</loc></sitemap>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
