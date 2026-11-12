import { NextResponse } from 'next/server'
import { SITEMAP_CONTENT_TYPE, toSitemapUrlsetXml } from '@/lib/sitemap-xml'
import { studySiteOrigin } from '@/lib/study-origin'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import { buildStudySitemapSection } from '@/lib/study-sitemap'

/**
 * One file of a study's sitemap: its pages, or one page of its scripts. The
 * study's `/sitemap.xml` indexes these, and every URL in them is on the study's
 * own host.
 */
export const revalidate = false

const XML_SUFFIX = '.xml'

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named GET/etc.
export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string; section: string }> }
) {
  const { siteSlug, section } = await context.params
  await getStudySiteOrNotFound(siteSlug)

  if (!studySiteOrigin(siteSlug) || !section.endsWith(XML_SUFFIX)) {
    return new NextResponse(null, { status: 404 })
  }

  const entries = await buildStudySitemapSection(
    siteSlug,
    section.slice(0, -XML_SUFFIX.length)
  )

  return new NextResponse(toSitemapUrlsetXml(entries), {
    headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
  })
}
