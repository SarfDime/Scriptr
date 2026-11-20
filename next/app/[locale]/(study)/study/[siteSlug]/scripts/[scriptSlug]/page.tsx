import { pickLocalizedPortableText } from '@shared/utils/localized-portable-text'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { ScriptDetailPageSkeleton } from '@/components/academics/scripts/detail/ScriptDetailSkeleton'
import { ScriptDetailView } from '@/components/academics/scripts/detail/ScriptDetailView'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { fetchWebsiteSeoSettings } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScript } from '@/lib/api/scripts-api'
import { convertToPlainText } from '@/lib/common-utils'
import { loadScriptDetailScript } from '@/lib/script-detail-page'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import type { LocalePageProps } from '@/types/localization.types'

type ScriptSiteRouteParams = { siteSlug: string; scriptSlug: string }

export async function generateMetadata({
  params,
}: LocalePageProps<ScriptSiteRouteParams>): Promise<Metadata> {
  const { siteSlug, scriptSlug, locale } = await params
  const [script, websiteSettings] = await Promise.all([
    getScript(scriptSlug).catch(() => null),
    fetchWebsiteSeoSettings(),
  ])

  const site = await getStudySiteOrNotFound(siteSlug).catch(() => null)
  if (!script || !site || script.study_id !== site.dbId) return {}

  const siteName = websiteSettings.siteName ?? 'Scriptr'
  const title = pickLocalizedPortableText(script.title, locale)
  const description = pickLocalizedPortableText(script.description, locale)

  return PageSEO({
    seoTitle: `${convertToPlainText({ value: title ?? undefined })} | ${siteName}`,
    seoDescription:
      convertToPlainText({ value: description ?? undefined }) ||
      websiteSettings.defaultSeoDescription,
    pagePath: getAcademicPath(
      { type: 'script', scriptSlug: script.slug, siteSlug },
      locale
    ),
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
 *
 * The slug is reader-supplied, so the page resolves it inside a `<Suspense>`
 * boundary and the study's chrome is prerendered around it. A missing script
 * still reaches `notFound()`, after the shell — a soft 404 with `noindex`.
 */
export default function StudyScriptPage({
  params,
}: LocalePageProps<ScriptSiteRouteParams>) {
  return (
    <Suspense fallback={<ScriptDetailPageSkeleton />}>
      <ScriptRoute params={params} />
    </Suspense>
  )
}

async function ScriptRoute({ params }: LocalePageProps<ScriptSiteRouteParams>) {
  const { siteSlug, scriptSlug, locale } = await params
  const site = await getStudySiteOrNotFound(siteSlug)
  const script = await loadScriptDetailScript(scriptSlug)

  if (!site.dbId || script.study_id !== site.dbId) notFound()

  if (scriptSlug !== script.slug) {
    permanentRedirect(
      getAcademicPath(
        { type: 'script', scriptSlug: script.slug, siteSlug },
        locale
      )
    )
  }

  return (
    <ScriptDetailView
      script={script}
      title={pickLocalizedPortableText(script.title, locale) ?? []}
    />
  )
}
