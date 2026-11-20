import { localizedPath } from '@shared/utils/localized-path'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import { languageAlternates } from '@/lib/localized-metadata'
import { loadPublicProfilePage } from '@/lib/profile-page'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * Profile view for any user by username. The username is only known at request
 * time, so the profile is resolved inside a `<Suspense>` boundary: the shell
 * around it is prerendered and the page streams in.
 *
 * A missing username still reaches `notFound()`, but after the shell has been
 * sent — the response is a `200` carrying the localized 404 with `noindex`.
 *
 * No sign-in is needed to view it; the loader redirects to `/user` when the
 * username is the viewer's own.
 *
 * The metadata names the page in both languages without loading the profile:
 * the address is the username alone.
 */
export async function generateMetadata({
  params,
}: LocalePageProps<{ username: string }>): Promise<Metadata> {
  const { username, locale } = await params
  const path = `/user/${username}`

  return {
    alternates: {
      canonical: localizedPath(path, locale),
      languages: languageAlternates(path),
    },
  }
}

export default function PublicUserProfilePage({
  params,
}: LocalePageProps<{ username: string }>) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <PublicProfile params={params} />
    </Suspense>
  )
}

async function PublicProfile({
  params,
}: LocalePageProps<{ username: string }>) {
  const { username } = await params
  const viewModel = await loadPublicProfilePage(username)

  return <ProfilePage {...viewModel} />
}
