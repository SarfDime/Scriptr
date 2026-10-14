import { redirect } from 'next/navigation'
import { UserProfilePage } from '@/components/profile/UserProfilePage'
import { getSessionRequired } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { getUserSubjectsForStudies } from '@/lib/profile-subjects'

export default async function Page() {
  const session = await getSessionRequired(await getRequestCookieHeader())

  if (!session?.user) {
    redirect('/auth')
  }

  const subjects = await getUserSubjectsForStudies(
    session.user.selected_study_ids,
    session.user.subjects
  )

  return <UserProfilePage subjects={subjects} />
}
