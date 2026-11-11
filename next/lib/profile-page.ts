import { notFound, redirect } from 'next/navigation'
import { getSession, getSessionRequired } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import {
  getMyProfile,
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
  const cookie = await getRequestCookieHeader()
  const session = await getSessionRequired(cookie)
  if (!session?.user) redirect('/auth')

  const [profile, catalog, studyTip] = await Promise.all([
    getMyProfile(cookie),
    getOnboardingCatalog(),
    getDailyStudyTip(),
  ])

  // Every study the account has joined: the profile's own page is not scoped
  // to one, so the sidebar lists all of them and filters by study in place.
  const studyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )

  return {
    catalog,
    studyTip,
    subjects: await getProfileSubjectSections(studyIds, profile.subjects),
  }
}

/**
 * Loads everything the public profile page (`/user/[username]`) renders.
 *
 * Two decisions are made here, before any component renders, so they can still
 * produce a real response status (the route has no `loading.tsx` on purpose: a
 * Suspense boundary above the page would flush a `200` before `notFound()`):
 *
 * - A signed-in viewer opening their own username is redirected to `/user`, the
 *   editable view (except in a study's own view, where that would drop the
 *   study context). If the session can't be read the public view is used.
 * - Given a `studyId`, the page 404s when the person is not a member of it and
 *   shows only that study's academic profile.
 * - `getPublicProfileByUsername` returns `null` only when the API answered
 *   `404`, which becomes `notFound()`. Any other failure throws, so it reaches
 *   the error boundary instead of showing a false 404.
 *
 * Stats are the one contained read: `getProfileStats` returns `null` on
 * failure, which leaves the counts `undefined` so the activity strip is
 * skipped rather than showing invented zeros.
 */
export const loadPublicProfilePage = async (
  username: string,
  /** Narrows the page to one study: the academic profile a reader has there,
   * and nothing about their other studies. Used by the study site's profile
   * page, which 404s when the person is not a member. */
  options: { studyId?: string } = {}
): Promise<PublicProfilePageViewModel> => {
  const session = await getSession(await getRequestCookieHeader())
  const isOwnUsername =
    session?.user?.username?.toLowerCase() === username.toLowerCase()
  if (isOwnUsername && !options.studyId) {
    redirect('/user')
  }

  const profile = await getPublicProfileByUsername(username)
  if (!profile) notFound()

  const memberStudyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )
  if (options.studyId && !memberStudyIds.includes(options.studyId)) notFound()

  const studyIds = options.studyId ? [options.studyId] : memberStudyIds
  const [stats, catalog, subjects, studyTip] = await Promise.all([
    getProfileStats(profile.id),
    getOnboardingCatalog(),
    // The catalog profile page lists what someone studies nowhere: their
    // affiliations are the academic profile, and the subjects belong to the
    // study site's view of them.
    options.studyId
      ? getProfileSubjectSections(studyIds, profile.subjects)
      : Promise.resolve(undefined),
    getDailyStudyTip(),
  ])

  return {
    profile,
    academics: buildProfileAcademics(
      catalog,
      options.studyId ? [] : profile.selected_faculties,
      options.studyId
        ? profile.selected_studies.filter(
            ({ study }) => study?.id === options.studyId
          )
        : profile.selected_studies
    ),
    subjects,
    studyTip,
    authoredCount: stats?.scripts_uploaded,
    commentCount: stats?.comments_made,
  }
}
