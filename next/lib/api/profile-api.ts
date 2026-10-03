import { apiRoutes } from '@shared/config/api-routes'
import type { ProfileSubjectStatus } from '@shared/types/api.types'
import type {
  MyProfileResponse,
  ProfileStats,
  PublicProfileResponse,
} from '@shared/types/profile.types'
import { apiFetch } from './next-api'

/**
 * Session-scoped, like getSession/getMyScriptVote: never cached. Two call
 * shapes — no `cookie` (Client Component, browser attaches it) or a
 * `cookie` arg (Server Component forwarding getRequestCookieHeader()).
 * `/user/page.tsx` currently only needs the browser-call shape (it's a
 * Client Component), but this matches the rest of the -api.ts files'
 * convention regardless.
 */
export const getMyProfile = (cookie?: string) =>
  apiFetch<MyProfileResponse>(apiRoutes.profiles.me, {
    cache: 'no-store',
    ...(cookie ? { headers: { cookie } } : {}),
  })

/**
 * Public — no auth, no cookie forwarding needed (the response is the same
 * for every viewer). `no-store` rather than tag-based caching for now:
 * this data changes on script upload/delete and profile edits, and wiring
 * that revalidation correctly (SCRIPT_CACHE_TAGS-style, but keyed by both
 * id and username) is a reasonable follow-up, not done here to keep this
 * change scoped to reading real data instead of hardcoded values.
 */
export const getPublicProfileById = (id: string) =>
  apiFetch<PublicProfileResponse>(apiRoutes.profiles.byId(id), {
    cache: 'no-store',
  })

export const getPublicProfileByUsername = (username: string) =>
  apiFetch<PublicProfileResponse>(
    apiRoutes.profiles.usernameByUsername(username),
    { cache: 'no-store' }
  )

/** Public — no auth. Same no-store rationale as the two functions above. */
export const getProfileStats = (id: string) =>
  apiFetch<ProfileStats>(apiRoutes.profiles.statsById(id), {
    cache: 'no-store',
  })

/** Idempotent add — session client, profile_id = auth.uid() RLS. */
export const addProfileFaculty = (facultyId: string) =>
  apiFetch(apiRoutes.profileFaculties.byFacultyId(facultyId), {
    method: 'POST',
  })

/**
 * Idempotent add — session client, profile_id = auth.uid() RLS.
 * NOTE: profile_studies has no RLS UPDATE policy despite the route doing
 * an upsert, so a repeat POST for a study the account already has would
 * 500. Callers (profile-sync.ts) must diff against the account's current
 * selections before calling this — never call it for a study the profile
 * already lists.
 */
export const addProfileStudy = (studyId: string) =>
  apiFetch(apiRoutes.profileStudies.byStudyId(studyId), { method: 'POST' })

export const setProfileSubjectStatus = (
  subjectId: string,
  status: ProfileSubjectStatus
) =>
  apiFetch(apiRoutes.profileSubjects.bySubjectId(subjectId), {
    method: 'PUT',
    body: { status },
  })
