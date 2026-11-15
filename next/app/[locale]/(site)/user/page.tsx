import { ProfilePage } from '@/components/profile/ProfilePage'
import { loadMyProfilePage } from '@/lib/profile-page'

/**
 * The signed-in user's own profile. Server Component: the loader resolves the
 * session redirect and reads the profile, its stats, its affiliations and its
 * subjects, and the page renders them with the shared `ProfilePage` in its
 * owner variant. An edit shows up because the profile form refreshes the route
 * (see `useEditProfileForm`), which re-runs this loader.
 */
export default async function Page() {
  const viewModel = await loadMyProfilePage()

  return <ProfilePage {...viewModel} isOwner />
}
