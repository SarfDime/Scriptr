import { notFound, redirect } from 'next/navigation'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { getSession } from '@/lib/api/auth-api'
import { ApiError, getRequestCookieHeader } from '@/lib/api/next-api'
import {
  getProfileStats,
  getPublicProfileByUsername,
} from '@/lib/api/profile-api'
import { buildProfileAcademics } from '@/lib/profile-academic-links'
import {
  getOnboardingCatalog,
  getProfileSubjectSections,
} from '@/lib/profile-subjects'
import { getDailyStudyTip } from '@/lib/study-tip'

/**
 * Profile view for any user by username. Server Component: the profile,
 * stats and subjects reads are plain async fetches, so everything resolves
 * before this renders and there is no client-side loading state.
 *
 * No sign-in is needed to view it. The session is read only to send people
 * to `/user` when the username is their own, so they get the editable view.
 * If the session can't be read the page falls back to the public view.
 */
export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const session = await getSession(await getRequestCookieHeader())
  if (session?.user?.username?.toLowerCase() === username.toLowerCase()) {
    redirect('/user')
  }

  let profile: Awaited<ReturnType<typeof getPublicProfileByUsername>>
  try {
    profile = await getPublicProfileByUsername(username)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  if (!profile) {
    notFound()
  }

  const studyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )
  const [stats, catalog, subjects, studyTip] = await Promise.all([
    getProfileStats(profile.id),
    getOnboardingCatalog(),
    getProfileSubjectSections(studyIds, profile.subjects),
    getDailyStudyTip(),
  ])

  return (
    <ProfilePage
      profile={profile}
      academics={buildProfileAcademics(
        catalog,
        profile.selected_faculties,
        profile.selected_studies
      )}
      subjects={subjects}
      studyTip={studyTip}
      authoredCount={stats.scripts_uploaded}
      commentCount={stats.comments_made}
    />
  )
}
