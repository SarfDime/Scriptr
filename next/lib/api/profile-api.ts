import { apiRoutes } from '@shared/config/api-routes'
import { PROFILE_CACHE_TAGS } from '@shared/config/cache-tags'
import { UI_STRINGS } from '@shared/config/strings'
import type {
  MyProfileResponse,
  ProfileStats,
  ProfileSubjectStatus,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  PublicProfileResponse,
} from '@shared/types/profile.types'
import { ApiError, apiFetchPublicRead, apiFetchRequired } from './next-api'

/**
 * Session-scoped, like getSession/getMyScriptVote: never cached. Two call
 * shapes — no `cookie` (Client Component, browser attaches it) or a
 * `cookie` arg (Server Component forwarding getRequestCookieHeader()).
 * `/user/page.tsx` currently only needs the browser-call shape (it's a
 * Client Component), but this matches the rest of the -api.ts files'
 * convention regardless.
 */
export const getMyProfile = (cookie?: string) =>
  apiFetchRequired<MyProfileResponse>(apiRoutes.profiles.me, {
    cache: 'no-store',
    ...(cookie ? { headers: { cookie } } : {}),
  })

/**
 * Public — no auth, no cookie forwarding needed (the response is the same
 * for every viewer). Script uploads/deletes, favorites changes, and profile
 * edits revalidate the shared public-profile tag.
 */
export const getPublicProfileById = (id: string) =>
  apiFetchPublicRead<PublicProfileResponse | null>(
    apiRoutes.profiles.byId(id),
    null,
    {
      cache: 'force-cache',
      next: { tags: [PROFILE_CACHE_TAGS.public()] },
    }
  )

export const getPublicProfileByUsername = (username: string) =>
  apiFetchPublicRead<PublicProfileResponse | null>(
    apiRoutes.profiles.usernameByUsername(username),
    null,
    { cache: 'force-cache', next: { tags: [PROFILE_CACHE_TAGS.public()] } }
  )

/** Public — no auth. Invalidated when the profile's public stats change. */
export const getProfileStats = (id: string) =>
  apiFetchPublicRead<ProfileStats>(
    apiRoutes.profiles.statsById(id),
    {
      scripts_uploaded: 0,
      total_votes_received: 0,
      total_downloads: 0,
      comments_made: 0,
    },
    {
      cache: 'force-cache',
      next: { tags: [PROFILE_CACHE_TAGS.stats(id)] },
    }
  )

/**
 * Updates the signed-in user's profile. `username` is required on every
 * call; selection id arrays, when sent, replace that user's selections.
 * Not restriction-checked (the profiles UPDATE policy has no
 * `is_restricted()` clause), so callers don't go through
 * useProtectedAction. A taken username rejects with an `ApiError` of
 * status 409 and `field: 'username'`.
 */
export const updateMyProfile = (input: ProfileUpdateRequest) =>
  apiFetchRequired<ProfileUpdateResponse>(apiRoutes.profiles.me, {
    method: 'PATCH',
    body: input,
  })

/**
 * TODO(r2-optimization): avatar upload is intentionally not implemented.
 * It lands with the R2 optimization pipeline (PROGRESS.md, "R2
 * improvements"): a Hono route that optimizes and stores the image in R2
 * and writes `profiles.avatar_url`, called from here with the file as
 * FormData. Until then this always rejects, and the edit dialog keeps the
 * picker disabled behind AVATAR_UPLOAD_ENABLED (lib/profile-avatar.ts).
 */
export const uploadMyAvatar = async (_file: File): Promise<never> => {
  throw new ApiError(UI_STRINGS.profile.edit.avatarUploadUnavailable, 501)
}

/** Idempotent add — session client, profile_id = auth.uid() RLS. */
export const addProfileFaculty = (facultyId: string) =>
  apiFetchRequired(apiRoutes.profileFaculties.byFacultyId(facultyId), {
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
  apiFetchRequired(apiRoutes.profileStudies.byStudyId(studyId), {
    method: 'POST',
  })

export const setProfileSubjectStatus = (
  subjectId: string,
  status: ProfileSubjectStatus
) =>
  apiFetchRequired(apiRoutes.profileSubjects.bySubjectId(subjectId), {
    method: 'PUT',
    body: { status },
  })

/** Removes the signed-in user's status for a subject (own resource). */
export const removeProfileSubject = (subjectId: string) =>
  apiFetchRequired(apiRoutes.profileSubjects.bySubjectId(subjectId), {
    method: 'DELETE',
  })
