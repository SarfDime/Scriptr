import { notFound, redirect } from 'next/navigation'
import { getSession, getSessionRequired } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
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
import type {
  MyProfilePageViewModel,
  PublicProfilePageViewModel,
} from '@/types/components/ProfilePage.types'

/**
 * Loads what the signed-in user's own page (`/user`) needs from the server. The
 * profile itself is not read here — that page renders from the shared provider
 * so an edit shows up in place — but the subjects and the tip are per-request
 * reads, and the redirect has to happen before anything renders.
 */
export const loadMyProfilePage = async (): Promise<MyProfilePageViewModel> => {
  const session = await getSessionRequired(await getRequestCookieHeader())
  if (!session?.user) redirect('/auth')

  const [subjects, studyTip] = await Promise.all([
    getProfileSubjectSections(
      session.user.selected_study_ids,
      session.user.subjects
    ),
    getDailyStudyTip(),
  ])

  return { subjects, studyTip }
}

/**
 * Loads everything the public profile page (`/user/[username]`) renders.
 *
 * Two decisions are made here, before any component renders, so they can still
 * produce a real response status (the route has no `loading.tsx` on purpose: a
 * Suspense boundary above the page would flush a `200` before `notFound()`):
 *
 * - A signed-in viewer opening their own username is redirected to `/user`, the
 *   editable view. If the session can't be read the public view is used.
 * - `getPublicProfileByUsername` returns `null` only when the API answered
 *   `404`, which becomes `notFound()`. Any other failure throws, so it reaches
 *   the error boundary instead of showing a false 404.
 *
 * Stats are the one contained read: `getProfileStats` returns `null` on
 * failure, which leaves the counts `undefined` so the activity strip is
 * skipped rather than showing invented zeros.
 */
export const loadPublicProfilePage = async (
  username: string
): Promise<PublicProfilePageViewModel> => {
  const session = await getSession(await getRequestCookieHeader())
  if (session?.user?.username?.toLowerCase() === username.toLowerCase()) {
    redirect('/user')
  }

  const profile = await getPublicProfileByUsername(username)
  if (!profile) notFound()

  const studyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )
  const [stats, catalog, subjects, studyTip] = await Promise.all([
    getProfileStats(profile.id),
    getOnboardingCatalog(),
    getProfileSubjectSections(studyIds, profile.subjects),
    getDailyStudyTip(),
  ])

  return {
    profile,
    academics: buildProfileAcademics(
      catalog,
      profile.selected_faculties,
      profile.selected_studies
    ),
    subjects,
    studyTip,
    authoredCount: stats?.scripts_uploaded,
    commentCount: stats?.comments_made,
  }
}
