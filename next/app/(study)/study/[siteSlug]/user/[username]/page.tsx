import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { loadPublicProfilePage } from '@/lib/profile-page'
import { getStudySiteOrNotFound } from '@/lib/study-site'

/**
 * Someone's profile as seen inside one study's site: the academic profile they
 * have there, not their whole identity. The loader 404s when they are not a
 * member, so the page never claims a study the person is not in.
 *
 * Their name, avatar and activity are the global ones — the identity is shared
 * across studies, only the academic part is per study.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string; username: string }>
}): Promise<Metadata> {
  const { siteSlug, username } = await params
  const site = await getStudySiteOrNotFound(siteSlug)

  return { title: `${username} · ${site.name}` }
}

export default async function StudyUserProfilePage({
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
