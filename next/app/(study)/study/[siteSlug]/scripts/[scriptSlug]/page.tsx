import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { ScriptDetailView } from '@/components/academics/scripts/detail/ScriptDetailView'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { fetchWebsiteSeoSettings } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScript } from '@/lib/api/scripts-api'
import { convertToPlainText } from '@/lib/common-utils'
import { loadScriptDetailScript } from '@/lib/script-detail-page'
import { getStudySiteOrNotFound } from '@/lib/study-site'

type ScriptSiteRouteParams = { siteSlug: string; scriptSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<ScriptSiteRouteParams>
}): Promise<Metadata> {
  const { siteSlug, scriptSlug } = await params
  const [script, websiteSettings] = await Promise.all([
    getScript(scriptSlug).catch(() => null),
    fetchWebsiteSeoSettings(),
  ])

  const site = await getStudySiteOrNotFound(siteSlug).catch(() => null)
  if (!script || !site || script.study_id !== site.dbId) return {}

  const siteName = websiteSettings.siteName ?? 'Scriptr'

  return PageSEO({
    seoTitle: `${convertToPlainText({ value: script.title })} | ${siteName}`,
    seoDescription:
      convertToPlainText({ value: script.description ?? undefined }) ||
      websiteSettings.defaultSeoDescription,
    pagePath: getAcademicPath({
      type: 'script',
      scriptSlug: script.slug,
      siteSlug,
    }),
    siteName,
    siteUrl: websiteSettings.siteUrl,
    keywords: websiteSettings.defaultKeywords,
  })
}

/**
 * A script inside its study's site, which is its canonical address once the
 * study has a handle. The study is checked against the script's own study
 * rather than trusted from the URL, so a script never renders under a site it
 * does not belong to.
 */
export default async function StudyScriptPage({
  params,
}: {
  params: Promise<ScriptSiteRouteParams>
}) {
  const { siteSlug, scriptSlug } = await params
  const site = await getStudySiteOrNotFound(siteSlug)
  const script = await loadScriptDetailScript(scriptSlug)

  if (!site.dbId || script.study_id !== site.dbId) notFound()

  if (scriptSlug !== script.slug) {
    permanentRedirect(
      getAcademicPath({ type: 'script', scriptSlug: script.slug, siteSlug })
    )
  }

  return <ScriptDetailView script={script} />
}
