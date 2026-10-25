import { redirect } from 'next/navigation'
import { MyProfilePage } from '@/components/profile/MyProfilePage'
import { getSessionRequired } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { getProfileSubjectSections } from '@/lib/profile-subjects'
import { getDailyStudyTip } from '@/lib/study-tip'

export default async function Page() {
  const session = await getSessionRequired(await getRequestCookieHeader())

  if (!session?.user) {
    redirect('/auth')
  }

  const [subjects, studyTip] = await Promise.all([
    getProfileSubjectSections(
      session.user.selected_study_ids,
      session.user.subjects
    ),
    getDailyStudyTip(),
  ])

  return <MyProfilePage subjects={subjects} studyTip={studyTip} />
}
