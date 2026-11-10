import { MyProfilePage } from '@/components/profile/MyProfilePage'
import { loadMyProfilePage } from '@/lib/profile-page'

/**
 * The signed-in user's own profile. Server Component: the loader resolves the
 * session redirect, the subjects and the study tip, then the client page reads
 * the shared profile state so an edit shows up without a reload.
 */
export default async function Page() {
  const viewModel = await loadMyProfilePage()

  return <MyProfilePage {...viewModel} />
}
