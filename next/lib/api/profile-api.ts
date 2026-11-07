import {
  type ApiEndpoint,
  apiRoutes,
  withQuery,
} from '@shared/config/api-routes'
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
  AdminProfileDeleteResponse,
  AdminProfileDetail,
  AdminProfileRoleResponse,
  AdminProfilesListResponse,
  AdminProfilesQuery,
  MyProfileResponse,
  ProfileStats,
  ProfileSubjectStatus,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  PublicProfileResponse,
  UserRole,
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
 * Versions the cached public-profile payloads, the same way
 * `SCRIPT_COMMENT_COUNT_CACHE_VERSION` versions the script reads: it rides
 * along as a query parameter, so bumping it changes the fetch URL and every
 * cached body is bypassed instead of being read in a shape the app no longer
 * expects.
 *
 * Raised to 2 when `slug` joined `PROFILE_SCRIPT_FIELDS` in
 * `hono/src/routes/profiles.ts`. A copy cached before that has no `slug` on the
 * profile's scripts, and `getAcademicPath` threw on `undefined.startsWith`,
 * taking the whole profile page down.
 */
const PROFILE_PAYLOAD_VERSION = 2

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

/** Every public-profile read carries `PROFILE_PAYLOAD_VERSION`, so a bump
 * bypasses the cached bodies instead of reading them in the old shape. */
const versionedProfilePath = (path: ApiEndpoint) =>
  withQuery(path, { payloadVersion: PROFILE_PAYLOAD_VERSION })

export const getPublicProfileById = (id: string) =>
  fetchPublicProfile(versionedProfilePath(apiRoutes.profiles.byId(id)))

export const getPublicProfileByUsername = (username: string) =>
  fetchPublicProfile(
    versionedProfilePath(apiRoutes.profiles.usernameByUsername(username))
  )

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

const noStore = { cache: 'no-store' } as const

/** One page of the admin user manager's listing. Admin session + unlock
 * required, so the cookie has to come from the Server Component's loader. */
export const getAdminProfiles = (query: AdminProfilesQuery, cookie?: string) =>
  apiFetchRequired<AdminProfilesListResponse>(
    withQuery(apiRoutes.profiles.index, {
      limit: query.limit,
      offset: query.offset,
      search: query.search,
      role: query.role,
      sort: query.sort,
      order: query.order,
    }),
    { ...noStore, ...(cookie ? { headers: { cookie } } : {}) }
  )

/** The admin view of one profile: columns, counts and selection ids. */
export const getAdminProfile = (id: string, cookie?: string) =>
  apiFetchRequired<AdminProfileDetail>(apiRoutes.profiles.adminById(id), {
    ...noStore,
    ...(cookie ? { headers: { cookie } } : {}),
  })

/** Admin edit of someone else's username and full name. The selections are
 * sent only when the caller has them, and the API writes those with the
 * service-role client (their RLS has no admin override). */
export const updateProfileById = (
  id: string,
  input: Pick<ProfileUpdateRequest, 'username' | 'full_name'>
) =>
  apiFetchRequired<ProfileUpdateResponse>(apiRoutes.profiles.byId(id), {
    method: 'PATCH',
    body: input,
  })

/** Removes a profile, its avatar and its login. `auth_user_deleted: false`
 * means the profile is gone but the account can still sign in. */
export const deleteProfileById = (id: string) =>
  apiFetchRequired<AdminProfileDeleteResponse>(apiRoutes.profiles.byId(id), {
    method: 'DELETE',
  })

/** Admin role change, on the unlocked admin surface. */
export const setProfileRole = (id: string, role: UserRole) =>
  apiFetchRequired<AdminProfileRoleResponse>(
    apiRoutes.admin.profilesRoleById(id),
    { method: 'PATCH', body: { role } }
  )

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
