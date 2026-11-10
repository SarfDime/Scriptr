import { zValidator } from '@hono/zod-validator'
import {
  AVATAR_FILE_TYPES,
  AVATAR_MAX_STORED_BYTES,
  AVATAR_MAX_UPLOAD_BYTES,
} from '@shared/config/avatar'
import { UI_STRINGS } from '@shared/config/strings'
import type {
  AvatarUploadResponse,
  AvatarUploadUrlResponse,
} from '@shared/types/avatar.types'
import { getFileExtension, isFileType } from '@shared/utils/api.utils'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import type {
  AdminProfileDeleteResponse,
  AdminProfileDetail,
  AdminProfilesListResponse,
  ProfileUpdateConflictResponse,
  ProfileUpdateResponse,
} from '../../../shared/types/profile.types'
import type { ProfilePreferencesResponse } from '../../../shared/types/profile-preferences.types'
import {
  isOwner,
  isStudyRole,
  validateFullName,
  validateUsername,
} from '../../../shared/utils/api.utils'
import { createRateLimiter } from '../../../shared/utils/rate-limit'
import { requireAdminAccess } from '../lib/admin-access'
import {
  ADMIN_PROFILE_COLUMNS,
  ADMIN_PROFILES_SELECT,
  parseAdminProfilesQuery,
} from '../lib/admin-profiles-query'
import {
  avatarKeyBase,
  buildAvatarUrl,
  removeAvatarObject,
} from '../lib/avatar'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { optimizeStagedFile } from '../lib/file-optimizer'
import { honoLog } from '../lib/logger'
import {
  mergeProfilePreferences,
  readStoredProfilePreferences,
} from '../lib/profile-preferences'
import { deleteR2Files } from '../lib/r2'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { requireOwner } from '../lib/require-admin'
import {
  createStagedUpload,
  failureResponse,
  parseStagingKey,
} from '../lib/staging'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import { isUsernameTaken } from '../lib/username'
import type { HonoEnv } from '../types/env.types'

// profile_achievements replaced the old profiles.achievements jsonb column.
// The definition's study rides along (null for a global one) so the badge UI can
// tell a study achievement from a platform-wide one and name the study.
const PROFILE_ACHIEVEMENTS_SELECT =
  'achievements:profile_achievements(achievement_id, earned_at, achievement:achievement_definitions(title, description, metric, threshold, rarity, study:studies(id, name, site_slug)))'

/**
 * Shared by /me, /:id, and /username/:username — a viewer can render any
 * profile (their own or someone else's) through one shape now. All three
 * SELECT policies on profile_faculties/profile_studies/profile_subjects
 * are `qual: true` (public, confirmed against pg_policies), so this is
 * safe on the plain session client even for an anonymous caller — no
 * service-role client needed here.
 */
const PROFILE_ACADEMIC_SELECT =
  'subjects:profile_subjects(subject_id, status, updated_at), selected_faculties:profile_faculties(faculty:faculties(*, university:universities(id, name))), selected_studies:profile_studies(study:studies(*, faculty:faculties(*, university:universities(id, name))))'

/**
 * The projection used for both "scripts this profile authored" and
 * "scripts this profile favorited" — same shape either way, just reached
 * through a different relationship (see PROFILE_SCRIPTS_SELECT and
 * loadFavoriteScripts below).
 *
 * Deliberately doesn't join professors or a subject year:
 * `scripts.professor_id` has no direct FK to `professors.id` (only a
 * composite FK to `subject_professors`, per `scripts_subject_professor_fkey`
 * — confirmed via pg_constraint), and Postgres `subjects` has no `year`
 * column at all (year only exists in Sanity — confirmed against
 * information_schema.columns). Every other script-list endpoint in this
 * file already omits both for the same reason (see `ScriptSummary`'s doc
 * comment in scripts.types.ts); this follows that same, already-
 * established limitation rather than attempting a join that would 500.
 *
 * Comment counts are attached separately through the restricted
 * `get_script_comment_counts` RPC; comments are intentionally not directly
 * selectable by table-level grants.
 *
 * `author:profiles!author_id` — qualified for the same reason
 * PROFILE_SCRIPTS_SELECT below is: script_favorites bridges scripts and
 * profiles, so an unqualified `profiles` embed here risks the same kind
 * of ambiguity, just in the reverse direction. Included even though it's
 * redundant for the authored-scripts case (the profile being viewed
 * already *is* the author there) because it's not redundant for the
 * favorited-scripts case — each favorited script's actual author is
 * whoever wrote it, not the profile being viewed.
 */
const PROFILE_SCRIPT_FIELDS =
  'id, slug, title, description, vote_score, download_count, created_at, updated_at, subject:subjects(name), author:profiles!author_id(username, full_name), files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)'

/**
 * `scripts!author_id`, not a bare `scripts` — script_favorites has FKs to
 * both profiles.id and scripts.id, so PostgREST auto-detects it as a
 * many-to-many bridge ("profiles has scripts *through* favorites") in
 * addition to the direct scripts.author_id -> profiles.id relationship.
 * Left unqualified, both are valid paths and PostgREST rejects the embed
 * as ambiguous ("more than one relationship was found for 'profiles' and
 * 'scripts'") — this pins it to the direct authored-scripts FK
 * specifically. This was a pre-existing latent bug on /:id and
 * /username/:username too (they already had an unqualified
 * `scripts:scripts(...)` embed before this file's academic-selections
 * change), just not yet hit.
 */
const PROFILE_SCRIPTS_SELECT = `scripts:scripts!author_id(${PROFILE_SCRIPT_FIELDS})`

/** Flattens `script_favorites`' `{ script: {...} }` embed rows into a
 * plain `Array<ProfileScriptSummary>`, matching PROFILE_SCRIPTS_SELECT's
 * authored-scripts shape. */
function flattenFavoriteScripts<T extends { id: string }>(
  rows: Array<{ script: T | null }> | null | undefined
): Array<T> {
  return (rows ?? []).flatMap((row) => (row.script ? [row.script] : []))
}

async function attachScriptCommentCounts<T extends { id: string }>(
  c: Context<HonoEnv>,
  scripts: Array<T>
): Promise<Array<T & { comments: Array<{ count: number }> }> | null> {
  const counts = new Map<string, number>()
  const supabase = createSupabaseClient(c)

  for (let offset = 0; offset < scripts.length; offset += 100) {
    const scriptIds = scripts.slice(offset, offset + 100).map(({ id }) => id)
    const { data, error } = await supabase.rpc('get_script_comment_counts', {
      p_script_ids: scriptIds,
    })
    if (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to fetch profile script comment counts',
        error,
      })
      return null
    }

    for (const row of data) {
      counts.set(row.script_id, row.comment_count)
    }
  }

  return scripts.map((script) => ({
    ...script,
    comments: [{ count: counts.get(script.id) ?? 0 }],
  }))
}

function profileQueryErrorResponse(
  c: Context<HonoEnv>,
  error: { code?: string; message: string }
) {
  if (error.code === 'PGRST116') {
    return c.json({ error: 'User not found' }, 404)
  }
  honoLog({
    logLevel: 'error',
    message: 'Failed to fetch profile',
    error,
  })
  return c.json({ error: 'Unable to load this profile' }, 500)
}

/**
 * Favorited scripts (with comment counts) for any profile, on the plain
 * session client: `script_favorites`' SELECT policy ("Favorites are
 * publicly readable") is `true`, confirmed against pg_policies, so no
 * service-role client is needed even for an anonymous viewer. Writes stay
 * owner-only through the table's own INSERT/DELETE policies. Returns null
 * on failure so callers answer 500 instead of rendering a failed load as
 * "no favorites".
 *
 * `scripts!script_id`, not a bare `scripts`: there is only one path from
 * script_favorites to scripts (script_id), so the embed isn't ambiguous
 * today — qualified anyway, for the same "pin it explicitly" habit
 * PROFILE_SCRIPTS_SELECT's comment explains.
 */
async function loadFavoriteScripts(c: Context<HonoEnv>, userId: string) {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('script_favorites')
    .select(`script:scripts!script_id(${PROFILE_SCRIPT_FIELDS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to fetch profile favorite scripts',
      error,
    })
    return null
  }

  return attachScriptCommentCounts(c, flattenFavoriteScripts(data))
}

type DatabaseError = { code?: string; message: string }

type ProfileUpdateInput = {
  username: string
  fullName: string | undefined
  facultyIds: Array<string> | undefined
  studyIds: Array<string> | undefined
}

type ProfileUpdateParseResult =
  | { ok: true; input: ProfileUpdateInput }
  | { ok: false; error: string }

const isStringArray = (value: unknown): value is Array<string> =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/** `undefined` when absent, `null` when present but not an array of strings. */
function parseIdList(value: unknown): Array<string> | undefined | null {
  if (value === undefined) return undefined
  return isStringArray(value) ? value : null
}

/**
 * Validates a PATCH /profiles/me or /profiles/:id body. The username and
 * full name are stored trimmed — validation already ran against the trimmed
 * value, so storing the raw one let padded names through.
 */
async function parseProfileUpdate(
  c: Context<HonoEnv>
): Promise<ProfileUpdateParseResult> {
  const body: unknown = await c.req.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid request body' }
  }

  const { username, full_name, selected_faculty_ids, selected_study_ids } =
    body as Record<string, unknown>

  const usernameError = validateUsername(username)
  if (usernameError || typeof username !== 'string') {
    return { ok: false, error: usernameError ?? 'Username is required' }
  }

  if (full_name !== undefined) {
    const fullNameError = validateFullName(full_name)
    if (fullNameError || typeof full_name !== 'string') {
      return { ok: false, error: fullNameError ?? 'Full name must be a string' }
    }
  }

  const facultyIds = parseIdList(selected_faculty_ids)
  if (facultyIds === null) {
    return { ok: false, error: 'selected_faculty_ids must be an array of ids' }
  }

  const studyIds = parseIdList(selected_study_ids)
  if (studyIds === null) {
    return { ok: false, error: 'selected_study_ids must be an array of ids' }
  }

  return {
    ok: true,
    input: {
      username: username.trim(),
      fullName: typeof full_name === 'string' ? full_name.trim() : undefined,
      facultyIds,
      studyIds,
    },
  }
}

/** Which ids to insert and which to delete to turn `current` into `next`. */
function diffSelections(
  current: ReadonlyArray<string>,
  next: ReadonlyArray<string>
) {
  const currentIds = new Set(current)
  const nextIds = new Set(next)
  return {
    toAdd: [...nextIds].filter((id) => !currentIds.has(id)),
    toRemove: [...currentIds].filter((id) => !nextIds.has(id)),
  }
}

async function syncFacultySelections(
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  facultyIds: Array<string>
): Promise<DatabaseError | null> {
  const { data, error } = await supabase
    .from('profile_faculties')
    .select('faculty_id')
    .eq('profile_id', profileId)
  if (error) return error

  const { toAdd, toRemove } = diffSelections(
    data.map((row) => row.faculty_id),
    facultyIds
  )

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('profile_faculties')
      .insert(
        toAdd.map((facultyId) => ({
          profile_id: profileId,
          faculty_id: facultyId,
        }))
      )
    if (insertError) return insertError
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('profile_faculties')
      .delete()
      .eq('profile_id', profileId)
      .in('faculty_id', toRemove)
    if (deleteError) return deleteError
  }

  return null
}

async function syncStudySelections(
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  studyIds: Array<string>
): Promise<DatabaseError | null> {
  const { data, error } = await supabase
    .from('profile_studies')
    .select('study_id')
    .eq('profile_id', profileId)
  if (error) return error

  const { toAdd, toRemove } = diffSelections(
    data.map((row) => row.study_id),
    studyIds
  )

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('profile_studies')
      .insert(
        toAdd.map((studyId) => ({ profile_id: profileId, study_id: studyId }))
      )
    if (insertError) return insertError
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('profile_studies')
      .delete()
      .eq('profile_id', profileId)
      .in('study_id', toRemove)
    if (deleteError) return deleteError
  }

  return null
}

/**
 * Replaces the selections a PATCH body included. Rows are diffed, with
 * inserts before deletes, so a failure part-way leaves a profile with extra
 * selections rather than none. Not atomic across the two tables — that
 * would need an RPC.
 */
async function syncSelections(
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  input: ProfileUpdateInput
): Promise<DatabaseError | null> {
  if (input.facultyIds) {
    const error = await syncFacultySelections(
      supabase,
      profileId,
      input.facultyIds
    )
    if (error) return error
  }

  if (input.studyIds) {
    const error = await syncStudySelections(supabase, profileId, input.studyIds)
    if (error) return error
  }

  return null
}

const usernameTakenResponse = (c: Context<HonoEnv>) =>
  c.json<ProfileUpdateConflictResponse>(
    { error: 'Username already taken', field: 'username' },
    409
  )

/** Postgres errors → clean HTTP codes for the profile + selection writes. */
function profileWriteErrorResponse(c: Context<HonoEnv>, error: DatabaseError) {
  switch (error.code) {
    case 'PGRST116':
      return c.json({ error: 'User not found' }, 404)
    case '23503':
      return c.json(
        { error: 'A selected faculty or study does not exist' },
        409
      )
    case '42501':
      return c.json({ error: 'Not allowed to update this profile' }, 403)
    default:
      return databaseErrorResponse(c, error)
  }
}

/**
 * Shared body of PATCH /me and PATCH /:id. The profiles row goes through
 * the session client either way (its UPDATE policy is `id = auth.uid()` or
 * `is_admin()`). The selection tables' policies are `profile_id =
 * auth.uid()` with no admin override, so an admin editing someone else's
 * selections has no RLS path and needs the service-role client — the
 * caller's admin check happens before this runs.
 *
 * The profile row is written first; if the selection sync then fails the
 * profile fields are already saved, so cache tags are revalidated either
 * way before the error is returned.
 */
async function updateProfile(
  c: Context<HonoEnv>,
  targetId: string,
  selectionAccess: 'owner' | 'admin'
) {
  const parsed = await parseProfileUpdate(c)
  if (!parsed.ok) return c.json({ error: parsed.error }, 400)
  const { input } = parsed

  const supabase = createSupabaseClient(c)

  // Same pre-check register runs (excluding this profile, so keeping the
  // current username isn't a conflict). The unique index below stays as the
  // backstop for a race past it.
  const usernameLookup = await isUsernameTaken(
    supabase,
    input.username,
    targetId
  )
  if (!usernameLookup.ok) return databaseErrorResponse(c, usernameLookup.error)
  if (usernameLookup.taken) return usernameTakenResponse(c)

  const { data, error } = await supabase
    .from('profiles')
    .update({ username: input.username, full_name: input.fullName })
    .eq('id', targetId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return usernameTakenResponse(c)
    return profileWriteErrorResponse(c, error)
  }

  const selectionClient =
    selectionAccess === 'admin' ? createInternalSupabaseClient(c) : supabase
  const selectionError = await syncSelections(selectionClient, targetId, input)

  await revalidateCacheTags(c.env, profileMutationTags(targetId))
  if (selectionError) return profileWriteErrorResponse(c, selectionError)

  return c.json<ProfileUpdateResponse>({ success: true, profile: data })
}

const profiles = new Hono<HonoEnv>()

/** Get one page of profiles (admin only), filtered and sorted.
 *
 * The page size is bounded (`limit`/`offset`, the shape the comment routes
 * validate) and `total` is the filtered count, so the UI can page without a
 * second request. `profiles` SELECT is public, so this route's admin check is
 * the only thing gating the listing. */
profiles.get('/', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const query = parseAdminProfilesQuery((name) => c.req.query(name))
  if (!query) {
    return c.json({ error: 'Invalid paging, filter or sort parameters' }, 400)
  }

  let request = supabase
    .from('profiles')
    .select(ADMIN_PROFILES_SELECT, { count: 'exact' })

  if (query.role) request = request.eq('role', query.role)
  if (query.searchPattern) {
    request = request.or(
      `username.ilike.${query.searchPattern},full_name.ilike.${query.searchPattern}`
    )
  }

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc', nullsFirst: false })
    .range(query.offset, query.offset + query.limit - 1)

  if (error) return databaseErrorResponse(c, error)

  return c.json<AdminProfilesListResponse>({
    profiles: data ?? [],
    total: count ?? 0,
    limit: query.limit,
    offset: query.offset,
  })
})

/** Get current user's profile */
profiles.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `*, ${PROFILE_ACHIEVEMENTS_SELECT}, ${PROFILE_ACADEMIC_SELECT}, ${PROFILE_SCRIPTS_SELECT}`
    )
    .eq('id', user.id)
    .single()

  if (error) return profileQueryErrorResponse(c, error)

  const [scripts, favoriteScripts] = await Promise.all([
    attachScriptCommentCounts(c, data.scripts),
    loadFavoriteScripts(c, user.id),
  ])
  if (!scripts || !favoriteScripts) {
    return c.json({ error: 'Unable to load this profile' }, 500)
  }

  return c.json({
    ...data,
    scripts,
    favorite_scripts: favoriteScripts,
  })
})

const isPreferencesLimited = createRateLimiter({
  limit: 15,
  windowMs: 60_000,
})

/** Read the caller's optional preferences. Missing rows remain `{}`. */
profiles.get('/me/preferences', authMiddleware, async (c) => {
  const user = c.get('user')
  if (isPreferencesLimited(user.id)) {
    return c.json({ error: 'Too many requests. Please slow down.' }, 429)
  }
  const { data, error } = await createSupabaseClient(c)
    .from('profile_preferences')
    .select('preferences')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  const preferences = data ? readStoredProfilePreferences(data.preferences) : {}
  if (!preferences) {
    honoLog({
      logLevel: 'error',
      message: 'Stored profile preferences are invalid',
      error: new Error('Invalid profile preference value'),
    })
    return c.json({ error: 'Unable to load preferences' }, 500)
  }
  return c.json<ProfilePreferencesResponse>({ preferences })
})

/** Merge and save the caller's versioned preferences. */
profiles.patch('/me/preferences', authMiddleware, async (c) => {
  const user = c.get('user')
  if (isPreferencesLimited(user.id)) {
    return c.json({ error: 'Too many requests. Please slow down.' }, 429)
  }
  const supabase = createSupabaseClient(c)
  const body = await readJsonBody(c)
  const { data: current, error: currentError } = await supabase
    .from('profile_preferences')
    .select('preferences')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (currentError) return databaseErrorResponse(c, currentError)

  const preferences = mergeProfilePreferences(
    current?.preferences ?? {},
    body.preferences
  )
  if (!preferences) {
    return c.json(
      { error: 'preferences must match the supported version 1 shape' },
      400
    )
  }

  const { data, error } = await supabase
    .from('profile_preferences')
    .upsert(
      {
        profile_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' }
    )
    .select('preferences')
    .single()
  if (error) return databaseErrorResponse(c, error)
  const storedPreferences = readStoredProfilePreferences(data.preferences)
  if (!storedPreferences) {
    return databaseErrorResponse(c, {
      message: 'Saved profile preferences could not be validated',
    })
  }
  return c.json<ProfilePreferencesResponse>({
    preferences: storedPreferences,
  })
})

/** Delete current user's profile */
profiles.delete('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { error } = await supabase.from('profiles').delete().eq('id', user.id)

  if (error) return databaseErrorResponse(c, error)
  await removeAvatarObject(c, user.id)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json({ success: true })
})

const { fileErrors } = UI_STRINGS.scripts.uploadModal
const avatarStrings = UI_STRINGS.profile.edit

// One avatar change is two calls (`upload-url` and the upload itself).
const isAvatarUploadLimited = createRateLimiter({
  limit: 20,
  windowMs: 10 * 60 * 1000,
})

const avatarUploadUrlSchema = z
  .object({
    name: z.string().min(1).max(255),
    size: z.number().int().positive(),
  })
  .transform((file, ctx) => {
    const extension = getFileExtension(file.name)
    if (!isFileType(extension) || !AVATAR_FILE_TYPES.includes(extension)) {
      ctx.addIssue({ code: 'custom', message: avatarStrings.avatarInvalidType })
      return z.NEVER
    }
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      ctx.addIssue({
        code: 'custom',
        message: avatarStrings.avatarTooLarge(
          AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024)
        ),
      })
      return z.NEVER
    }
    return { fileType: extension, size: file.size }
  })

const avatarUploadSchema = z.object({ stagingKey: z.string().min(1) })

/**
 * Change the avatar, step 1 of 2: a presigned PUT into staging, so the photo
 * goes from the browser straight to R2 (a phone photo is over Vercel's 4.5 MB
 * request limit). Then call `POST /profiles/me/avatar`.
 */
profiles.post(
  '/me/avatar/upload-url',
  authMiddleware,
  zValidator('json', avatarUploadUrlSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: result.error.issues[0]?.message ?? fileErrors.invalidRequest,
        },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    if (isAvatarUploadLimited(user.id)) {
      return c.json({ error: fileErrors.rateLimited }, 429)
    }

    try {
      const upload = await createStagedUpload(c, user.id, c.req.valid('json'))
      return c.json<AvatarUploadUrlResponse>({ success: true, upload })
    } catch (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to create an avatar upload URL',
        error,
      })
      return c.json({ error: fileErrors.stagingFailed }, 500)
    }
  }
)

/**
 * Change the avatar, step 2 of 2: crops, shrinks and converts the uploaded photo
 * (the optimizer's avatar profile) and stores it as `avatars/{userId}.webp` in
 * the script bucket, overwriting the previous picture, then points
 * `profiles.avatar_url` at its public URL.
 *
 * `avatar_url` is written with the internal client on purpose: the URL is shown
 * to everyone on cached pages, so users must not be able to set it to any value
 * themselves, and the column's direct UPDATE grant is revoked for that reason.
 * The caller's own row is the only one written, picked from the session.
 */
profiles.post(
  '/me/avatar',
  authMiddleware,
  zValidator('json', avatarUploadSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: fileErrors.invalidRequest }, 400)
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    if (isAvatarUploadLimited(user.id)) {
      return c.json({ error: fileErrors.rateLimited }, 429)
    }

    // `R2_PUBLIC_URL` is the bucket's public domain (`R2_BUCKET` itself is what
    // avatars are stored in), so without it there is no URL to point a profile at.
    const { R2_PUBLIC_URL: publicUrl } = c.env
    if (!publicUrl) {
      honoLog({
        logLevel: 'error',
        message: 'Avatar uploads are not configured',
        error: new Error('R2_PUBLIC_URL must be set'),
      })
      return c.json({ error: avatarStrings.avatarUploadUnavailable }, 503)
    }

    const { stagingKey } = c.req.valid('json')
    const declaredType = parseStagingKey(stagingKey, user.id)
    if (!(declaredType && AVATAR_FILE_TYPES.includes(declaredType))) {
      return c.json({ error: fileErrors.unknownUpload }, 400)
    }

    let result: Awaited<ReturnType<typeof optimizeStagedFile>>
    try {
      result = await optimizeStagedFile(c, {
        stagingBucket: c.env.R2_BUCKET,
        stagingKey,
        destinationBucket: c.env.R2_BUCKET,
        destinationKeyBase: avatarKeyBase(user.id),
        declaredType,
        purpose: 'avatar',
      })
    } catch (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to optimize an avatar',
        error,
      })
      result = { ok: false, reason: 'failed' }
    }

    if (!result.ok) {
      // Nothing was written over the old avatar, so only the staged copy is
      // left to remove.
      await deleteR2Files(c, [
        { bucket: c.env.R2_BUCKET, fileKey: stagingKey },
      ]).catch(() => undefined)
      const { status, message } = failureResponse(
        result,
        AVATAR_MAX_STORED_BYTES
      )
      return c.json({ error: message }, status)
    }

    // A new version, because the object key is the same one on every upload.
    const avatarUrl = buildAvatarUrl(
      publicUrl,
      user.id,
      Date.now().toString(36)
    )
    const { error } = await createInternalSupabaseClient(c)
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
    if (error) {
      // The stored object is not removed: it has already replaced the previous
      // picture, and deleting it would break the old URL the profile still
      // holds. The next successful upload rewrites it.
      return databaseErrorResponse(c, error)
    }

    await revalidateCacheTags(c.env, profileMutationTags(user.id))
    return c.json<AvatarUploadResponse>({ success: true, avatarUrl })
  }
)

/** Get a specific user profile by username (public — same shape as /:id) */
profiles.get('/username/:username', async (c) => {
  const username = requiredParam(c, 'username')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
        id,
        username,
        full_name,
        avatar_url,
        role,
        created_at,
        updated_at,
        ${PROFILE_ACHIEVEMENTS_SELECT},
        ${PROFILE_ACADEMIC_SELECT},
        ${PROFILE_SCRIPTS_SELECT}
      `)
    .eq('username', username)
    .single()

  if (error) return profileQueryErrorResponse(c, error)

  const [scripts, favoriteScripts] = await Promise.all([
    attachScriptCommentCounts(c, data.scripts),
    loadFavoriteScripts(c, data.id),
  ])
  if (!scripts || !favoriteScripts) {
    return c.json({ error: 'Unable to load this profile' }, 500)
  }
  return c.json({ ...data, scripts, favorite_scripts: favoriteScripts })
})

/** Get a specific user profile by ID (public — same shape as /username/:username) */
profiles.get('/:id', async (c) => {
  const userId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
        id,
        username,
        full_name,
        avatar_url,
        role,
        created_at,
        updated_at,
        ${PROFILE_ACHIEVEMENTS_SELECT},
        ${PROFILE_ACADEMIC_SELECT},
        ${PROFILE_SCRIPTS_SELECT}
      `)
    .eq('id', userId)
    .single()

  if (error) return profileQueryErrorResponse(c, error)

  const [scripts, favoriteScripts] = await Promise.all([
    attachScriptCommentCounts(c, data.scripts),
    loadFavoriteScripts(c, data.id),
  ])
  if (!scripts || !favoriteScripts) {
    return c.json({ error: 'Unable to load this profile' }, 500)
  }
  return c.json({ ...data, scripts, favorite_scripts: favoriteScripts })
})

/** Update current user's profile */
profiles.patch('/me', authMiddleware, (c) =>
  updateProfile(c, c.get('user').id, 'owner')
)

/** Update any user's profile (admin only) */
profiles.patch('/:id', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isOwner(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  return updateProfile(c, targetId, 'admin')
})

/** Delete any user's profile (admin only).
 *
 * The profile row goes first — RLS is the boundary that allows it — then the
 * avatar object, then the Supabase Auth login through the admin API. Deleting
 * the login matters: without it the account can still sign in with no profile
 * row behind it. A failure there does not fail the request (the profile is
 * already gone), but it is logged and reported as `auth_user_deleted: false`.
 */
profiles.delete('/:id', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isOwner(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  if (targetId === user.id) {
    return c.json({ error: 'You cannot delete your own account' }, 400)
  }

  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', targetId)
    .maybeSingle()

  if (lookupError) return databaseErrorResponse(c, lookupError)
  if (!existing) return c.json({ error: 'Profile not found' }, 404)

  const { error } = await supabase.from('profiles').delete().eq('id', targetId)

  if (error) return databaseErrorResponse(c, error)
  await removeAvatarObject(c, targetId)

  const { error: authError } =
    await createInternalSupabaseClient(c).auth.admin.deleteUser(targetId)

  if (authError) {
    honoLog({
      logLevel: 'error',
      message: `Deleted profile ${targetId} but not its login`,
      error: authError,
    })
  }

  await revalidateCacheTags(c.env, profileMutationTags(targetId))
  return c.json<AdminProfileDeleteResponse>({
    success: true,
    auth_user_deleted: !authError,
  })
})

/** One profile with what the admin user manager shows for it (admin only):
 * the editable columns, the selections it can display, and the counts that
 * would otherwise cost a query per row. */
profiles.get('/:id/admin', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isOwner(caller?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(ADMIN_PROFILE_COLUMNS)
    .eq('id', targetId)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const [scripts, comments, faculties, studies, studyRoles] = await Promise.all(
    [
      supabase
        .from('scripts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', targetId),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', targetId),
      supabase
        .from('profile_faculties')
        .select('faculty:faculties(id, name)')
        .eq('profile_id', targetId),
      supabase
        .from('profile_studies')
        .select('study:studies(id, name)')
        .eq('profile_id', targetId),
      supabase
        .from('study_roles')
        .select('role, study:studies(id, name)')
        .eq('profile_id', targetId),
    ]
  )

  const failure =
    scripts.error ??
    comments.error ??
    faculties.error ??
    studies.error ??
    studyRoles.error
  if (failure) return databaseErrorResponse(c, failure)

  return c.json<AdminProfileDetail>({
    profile,
    counts: { scripts: scripts.count ?? 0, comments: comments.count ?? 0 },
    faculties: (faculties.data ?? []).flatMap((row) =>
      row.faculty ? [row.faculty] : []
    ),
    studies: (studies.data ?? []).flatMap((row) =>
      row.study ? [row.study] : []
    ),
    studyRoles: (studyRoles.data ?? []).flatMap((row) =>
      row.study && isStudyRole(row.role)
        ? [{ studyId: row.study.id, studyName: row.study.name, role: row.role }]
        : []
    ),
  })
})

/** Get user statistics */
profiles.get('/:id/stats', async (c) => {
  const userId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { count: scriptsCount } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  const { data: scripts } = await supabase
    .from('scripts')
    .select('vote_score')
    .eq('author_id', userId)

  const totalVotes =
    scripts?.reduce((sum, script) => sum + (script.vote_score || 0), 0) || 0

  const { data: downloadData } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('author_id', userId)

  const totalDownloads =
    downloadData?.reduce(
      (sum, script) => sum + (script.download_count || 0),
      0
    ) || 0

  const { count: commentsCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)

  return c.json({
    scripts_uploaded: scriptsCount || 0,
    total_votes_received: totalVotes,
    total_downloads: totalDownloads,
    comments_made: commentsCount || 0,
  })
})

export default profiles
