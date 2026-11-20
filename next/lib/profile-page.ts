import { localizedPath } from '@shared/utils/localized-path'
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
import { getServerLocale } from '@/lib/server-strings'
import type { ProfilePageViewModel } from '@/types/components/ProfilePage.types'

/**
 * Loads everything the signed-in user's own page (`/user`) renders: the session
 * redirect, the profile, the affiliations' names and links (which resolve
 * through the catalog — Postgres holds ids, the routes use slugs), its stats and
 * every study's subjects. The page renders `ProfilePage` from it on the server;
 * an edit shows up because the profile form refreshes the route (see
 * `useEditProfileForm`).
 */
export const loadMyProfilePage = async (): Promise<ProfilePageViewModel> => {
  const cookie = await getRequestCookieHeader()
  const session = await getSessionRequired(cookie)
  const locale = await getServerLocale()
  if (!session?.user) redirect(localizedPath('/auth', locale))

  const [profile, catalog] = await Promise.all([
    getMyProfile(cookie),
    getOnboardingCatalog(),
  ])

  // Every study the account has joined: the profile's own page is not scoped
  // to one, so the sidebar lists all of them and filters by study in place.
  const studyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )

  const [subjects, stats] = await Promise.all([
    getProfileSubjectSections(studyIds, profile.subjects),
    getProfileStats(profile.id),
  ])

  return {
    profile,
    academics: buildProfileAcademics(
      catalog,
      profile.selected_faculties,
      profile.selected_studies,
      locale
    ),
    subjects,
    // The authored list is the count shown: `scripts_uploaded` also counts
    // scripts that were since removed from the list.
    authoredCount: profile.scripts.length,
    commentCount: stats?.comments_made,
  }
}

/**
 * Loads everything the public profile page (`/user/[username]`) renders.
 *
 * The username is only known at request time, so the page resolves this inside
 * a `<Suspense>` boundary and both decisions below run after the shell has been
 * sent — the page answers `200` either way:
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
): Promise<ProfilePageViewModel> => {
  const session = await getSession(await getRequestCookieHeader())
  const isOwnUsername =
    session?.user?.username?.toLowerCase() === username.toLowerCase()
  if (isOwnUsername && !options.studyId) {
    redirect(localizedPath('/user', await getServerLocale()))
  }

  const profile = await getPublicProfileByUsername(username)
  if (!profile) notFound()

  const memberStudyIds = profile.selected_studies.flatMap(({ study }) =>
    study ? [study.id] : []
  )
  if (options.studyId && !memberStudyIds.includes(options.studyId)) notFound()

  const studyIds = options.studyId ? [options.studyId] : memberStudyIds
  const [stats, catalog, subjects, locale] = await Promise.all([
    getProfileStats(profile.id),
    getOnboardingCatalog(),
    // The catalog profile page lists what someone studies nowhere: their
    // affiliations are the academic profile, and the subjects belong to the
    // study site's view of them.
    options.studyId
      ? getProfileSubjectSections(studyIds, profile.subjects)
      : Promise.resolve(undefined),
    getServerLocale(),
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
        : profile.selected_studies,
      locale
    ),
    subjects,
    authoredCount: stats?.scripts_uploaded,
    commentCount: stats?.comments_made,
  }
}
