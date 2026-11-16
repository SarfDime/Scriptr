import { NextResponse } from 'next/server'
import { SITEMAP_CONTENT_TYPE, toSitemapUrlsetXml } from '@/lib/sitemap-xml'
import { studySiteOrigin } from '@/lib/study-origin'
import { getStudySiteOrNotFound, listStudySites } from '@/lib/study-site'
import {
  buildStudySitemapIndex,
  buildStudySitemapSection,
  listStudySitemapSections,
  STUDY_SITEMAP_INDEX_SECTION,
} from '@/lib/study-sitemap'

/**
 * One file of a study's sitemap: its pages, or one page of its scripts. The
 * study's `/sitemap.xml` indexes these, and every URL in them is on the study's
 * own host.
 *
 * Like the index beside it, this sits outside `app/[locale]`: a sitemap entry
 * carries both languages, so the address has none.
 */
export const revalidate = false

const XML_SUFFIX = '.xml'

/** Every study's sections, so each file is built once instead of asking the
 * sitemap API on every crawl. */
export const generateStaticParams = async (): Promise<
  Array<{ siteSlug: string; section: string }>
> => {
  const params: Array<{ siteSlug: string; section: string }> = []

  for (const siteSlug of await listStudySites()) {
    // The index is a section of the route, not of the sitemap it publishes.
    params.push({
      siteSlug,
      section: `${STUDY_SITEMAP_INDEX_SECTION}${XML_SUFFIX}`,
    })

    for (const section of await listStudySitemapSections(siteSlug)) {
      params.push({ siteSlug, section: `${section.id}${XML_SUFFIX}` })
    }
  }

  return params
}

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

  const id = section.slice(0, -XML_SUFFIX.length)
  if (id === STUDY_SITEMAP_INDEX_SECTION) {
    const index = await buildStudySitemapIndex(siteSlug)
    return new NextResponse(index || null, {
      status: index ? 200 : 404,
      headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
    })
  }

  const entries = await buildStudySitemapSection(siteSlug, id)

  return new NextResponse(toSitemapUrlsetXml(entries), {
    headers: { 'Content-Type': SITEMAP_CONTENT_TYPE },
  })
}
