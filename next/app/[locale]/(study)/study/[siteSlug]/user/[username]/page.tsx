import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import { getStudySiteUrl } from '@/lib/academic-routes'
import { languageAlternates } from '@/lib/localized-metadata'
import { loadPublicProfilePage } from '@/lib/profile-page'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * Someone's profile as seen inside one study's site: the academic profile they
 * have there, not their whole identity. The loader 404s when they are not a
 * member, so the page never claims a study the person is not in — after the
 * shell has been sent, so that 404 is a soft one (`noindex`), like the catalog's
 * profile page.
 *
 * Their name, avatar and activity are the global ones — the identity is shared
 * across studies, only the academic part is per study.
 */
export async function generateMetadata({
  params,
}: {
  params: LocalePageProps<{ siteSlug: string; username: string }>['params']
}): Promise<Metadata> {
  const { siteSlug, username, locale } = await params
  const site = await getStudySiteOrNotFound(siteSlug)
  const path = `${getStudySiteUrl(siteSlug, locale)}/user/${username}`

  return {
    title: `${username} · ${site.name}`,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
  }
}

export default function StudyUserProfilePage({
  params,
}: {
  params: Promise<{ siteSlug: string; username: string }>
}) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <StudyMemberProfile params={params} />
    </Suspense>
  )
}

async function StudyMemberProfile({
  params,
}: {
  params: Promise<{ siteSlug: string; username: string }>
}) {
  const { siteSlug, username } = await params
  const site = await getStudySiteOrNotFound(siteSlug)

  if (!site.dbId) notFound()

  const viewModel = await loadPublicProfilePage(username, {
    studyId: site.dbId,
  })

  return <ProfilePage {...viewModel} />
}
