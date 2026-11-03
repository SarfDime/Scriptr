import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { ScriptDetailBody } from '@/components/academics/scripts/detail/ScriptDetailBody'
import { ScriptDetailSkeleton } from '@/components/academics/scripts/detail/ScriptDetailSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { fetchWebsiteSeoSettings } from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScript } from '@/lib/api/scripts-api'
import { convertToPlainText } from '@/lib/common-utils'
import { loadScriptDetailScript } from '@/lib/script-detail-page'

/** Gives the script page its canonical. A missing script yields no metadata
 * here; the page itself answers the `404`. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug: identifier } = await params
  const [script, websiteSettings] = await Promise.all([
    getScript(identifier).catch(() => null),
    fetchWebsiteSeoSettings(),
  ])

  if (!script) return {}

  const siteName = websiteSettings.siteName ?? 'Scriptr'

  return PageSEO({
    seoTitle: `${convertToPlainText({ value: script.title })} | ${siteName}`,
    seoDescription:
      convertToPlainText({ value: script.description ?? undefined }) ||
      websiteSettings.defaultSeoDescription,
    pagePath: getAcademicPath({ type: 'script', scriptSlug: script.slug }),
    siteName,
    siteUrl: websiteSettings.siteUrl,
    keywords: websiteSettings.defaultKeywords,
  })
}

/**
 * The script page. The existence check runs first (so a missing script answers
 * a real `404` — see `ScriptDetailSkeleton` on why the route has no
 * `loading.tsx`), then the rest of the screen streams behind a Suspense
 * boundary with the same skeleton that used to be the route's loading file.
 */
export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: identifier } = await params
  const script = await loadScriptDetailScript(identifier)

  // Links minted before slugs existed still reach the page; send them on to
  // the canonical address so a shared link and an indexed one agree.
  if (identifier !== script.slug) {
    permanentRedirect(
      getAcademicPath({ type: 'script', scriptSlug: script.slug })
    )
  }

  return (
    <PageLayout>
      <PageHeader title={script.title} />
      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetailBody scriptId={script.id} script={script} />
      </Suspense>
    </PageLayout>
  )
}
