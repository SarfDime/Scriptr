import { Suspense } from 'react'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import { loadMyProfilePage } from '@/lib/profile-page'

/**
 * The signed-in user's own profile. The session decides what renders — it owns
 * the redirect and the whole page — so the account is resolved inside the
 * boundary and only the chrome around it is prerendered.
 *
 * An edit shows up because the profile form refreshes the route (see
 * `useEditProfileForm`), which re-runs the loader.
 */
export default function Page() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <MyProfile />
    </Suspense>
  )
}

async function MyProfile() {
  const viewModel = await loadMyProfilePage()

  return <ProfilePage {...viewModel} isOwner />
}
