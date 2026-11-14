import { localizedPath } from '@shared/utils/localized-path'
import type { Metadata } from 'next'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { languageAlternates } from '@/lib/localized-metadata'
import { loadPublicProfilePage } from '@/lib/profile-page'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * Profile view for any user by username. Server Component: the loader's reads
 * all resolve before this renders, so there is no client-side loading state,
 * and no `loading.tsx` on purpose (see `loadPublicProfilePage`: a Suspense
 * boundary would flush a `200` before a missing profile reaches `notFound()`).
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

export default async function PublicUserProfilePage({
  params,
}: LocalePageProps<{ username: string }>) {
  const { username } = await params
  const viewModel = await loadPublicProfilePage(username)

  return <ProfilePage {...viewModel} />
}
