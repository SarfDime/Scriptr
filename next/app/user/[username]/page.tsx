import { ProfilePage } from '@/components/profile/ProfilePage'
import { loadPublicProfilePage } from '@/lib/profile-page'

/**
 * Profile view for any user by username. Server Component: the loader's reads
 * all resolve before this renders, so there is no client-side loading state,
 * and no `loading.tsx` on purpose (see `loadPublicProfilePage`: a Suspense
 * boundary would flush a `200` before a missing profile reaches `notFound()`).
 *
 * No sign-in is needed to view it; the loader redirects to `/user` when the
 * username is the viewer's own.
 */
export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const viewModel = await loadPublicProfilePage(username)

  return <ProfilePage {...viewModel} />
}
