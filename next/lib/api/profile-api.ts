import { apiRoutes } from '@shared/config/api-routes'
import { PROFILE_CACHE_TAGS } from '@shared/config/cache-tags'
import { UPLOAD_FINALIZE_TIMEOUT_MS } from '@shared/config/next-constants'
import type { QueryApiEndpointType } from '@shared/types/api.types'
import type {
  AvatarUploadRequest,
  AvatarUploadResponse,
  AvatarUploadUrlRequest,
  AvatarUploadUrlResponse,
} from '@shared/types/avatar.types'
import type {
  MyProfileResponse,
  ProfileStats,
  ProfileSubjectStatus,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  PublicProfileResponse,
} from '@shared/types/profile.types'
import type {
  ProfilePreferencesPatch,
  ProfilePreferencesResponse,
} from '@shared/types/profile-preferences.types'
import { nextLogs } from '@/lib/logger'
import { ApiError, apiFetchRequired } from './next-api'
import { putToStaging, toUserFacingUploadError } from './upload'

export const getMyProfilePreferences = (cookie?: string) =>
  apiFetchRequired<ProfilePreferencesResponse>(
    apiRoutes.profiles.mePreferences,
    {
      cache: 'no-store',
      ...(cookie ? { headers: { cookie } } : {}),
    }
  )

export const updateMyProfilePreferences = (
  preferences: ProfilePreferencesPatch
) =>
  apiFetchRequired<ProfilePreferencesResponse>(
    apiRoutes.profiles.mePreferences,
    {
      method: 'PATCH',
      body: { preferences },
    }
  )

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
 *
 * `null` means the API answered `404`: no such profile. Anything else —
 * unreachable API, a `5xx` — throws instead, because the page turns `null`
 * into `notFound()` and would otherwise tell the reader a profile that
 * exists does not. There is no build-time use of these reads, so the
 * fallback in `apiFetchPublicRead` is not needed here.
 */
const fetchPublicProfile = async (path: QueryApiEndpointType) => {
  try {
    return await apiFetchRequired<PublicProfileResponse>(path, {
      cache: 'force-cache',
      next: { tags: [PROFILE_CACHE_TAGS.public()] },
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export const getPublicProfileById = (id: string) =>
  fetchPublicProfile(apiRoutes.profiles.byId(id))

export const getPublicProfileByUsername = (username: string) =>
  fetchPublicProfile(apiRoutes.profiles.usernameByUsername(username))

/** Public — no auth. Invalidated when the profile's public stats change.
 *
 * `null` when the read fails. The caller renders these as plain numbers, so
 * falling back to zeros would claim the person has uploaded nothing. */
export const getProfileStats = async (id: string) => {
  try {
    return await apiFetchRequired<ProfileStats>(
      apiRoutes.profiles.statsById(id),
      {
        cache: 'force-cache',
        next: { tags: [PROFILE_CACHE_TAGS.stats(id)] },
      }
    )
  } catch (error) {
    nextLogs({
      message: `Profile stats could not be read for ${id}.`,
      logLevel: 'warn',
      error,
    })
    return null
  }
}

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
 * Changes the signed-in user's avatar with the same direct-to-R2 flow as a
 * script file: a presigned PUT straight to R2 (so a phone photo never passes
 * through Vercel's request limit), then one call that crops, shrinks and
 * stores it as WebP and points `profiles.avatar_url` at the new object.
 * Resolves to the new stable public URL. Rejections carry messages written for
 * the user, so callers show them as they are.
 */
export const uploadMyAvatar = async (file: File): Promise<string> => {
  const urlsRequest: AvatarUploadUrlRequest = {
    name: file.name,
    size: file.size,
  }
  const { upload } = await apiFetchRequired<AvatarUploadUrlResponse>(
    apiRoutes.profiles.meAvatarUploadUrl,
    { method: 'POST', body: urlsRequest }
  ).catch((error: unknown) => {
    throw toUserFacingUploadError(error)
  })

  await putToStaging(upload, file)

  // Cropping and converting can take a moment, like finalizing a script file.
  const uploadRequest: AvatarUploadRequest = {
    stagingKey: upload.stagingKey,
  }
  const { avatarUrl } = await apiFetchRequired<AvatarUploadResponse>(
    apiRoutes.profiles.meAvatar,
    {
      method: 'POST',
      body: uploadRequest,
      timeoutMs: UPLOAD_FINALIZE_TIMEOUT_MS,
    }
  ).catch((error: unknown) => {
    throw toUserFacingUploadError(error)
  })

  return avatarUrl
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
