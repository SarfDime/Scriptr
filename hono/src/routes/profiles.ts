import type { Context } from 'hono'
import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import { isAdmin, validateUsername } from '../../../shared/utils/api.utils'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// profile_achievements replaced the old profiles.achievements jsonb column.
const PROFILE_ACHIEVEMENTS_SELECT =
  'achievements:profile_achievements(achievement_id, earned_at, achievement:achievement_definitions(title, description, metric, threshold))'

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
 * fetchFavoriteScripts below).
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
  'id, title, description, vote_score, download_count, created_at, updated_at, subject:subjects(name), author:profiles!author_id(username, full_name), files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)'

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

/**
 * /me only, as a direct embed — script_favorites' SELECT RLS policy
 * scopes reads to `profile_id = auth.uid()`, which already covers "the
 * owner reading their own favorites" without needing the internal
 * client. Public reads (/:id, /username/:username) go through
 * fetchFavoriteScripts below instead, using the service-role client,
 * since the viewer there has no RLS path of their own to another user's
 * script_favorites rows — this is a deliberate product choice (favorited
 * scripts are shown on public profiles), not a general RLS relaxation:
 * the table itself stays owner-only for any other direct query.
 */
const PROFILE_FAVORITE_SCRIPTS_SELECT = `favorite_scripts:script_favorites(script:scripts!script_id(${PROFILE_SCRIPT_FIELDS}))`

/** Flattens `script_favorites`' `{ script: {...} }` embed rows into a
 * plain `Array<ProfileScriptSummary>`, used both for /me (post-processing
 * the direct embed above) and for the two public routes (post-processing
 * the separate internal-client query below) — same output shape either
 * way, matching PROFILE_SCRIPTS_SELECT's authored-scripts shape. */
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
 * Public routes only (/:id, /username/:username) — service-role client,
 * since the caller (anonymous, or a different logged-in user) has no RLS
 * path to another user's script_favorites rows. `scripts!script_id`, not
 * a bare `scripts`: script_favorites has FKs to both profiles.id and
 * scripts.id, but there's only one path from script_favorites
 * specifically to scripts (script_id), so this particular embed isn't
 * actually ambiguous — qualified anyway, for the same "pin it explicitly"
 * habit PROFILE_SCRIPTS_SELECT's comment explains, rather than relying on
 * there never being a second FK added later.
 */
async function fetchFavoriteScripts(c: Context<HonoEnv>, userId: string) {
  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('script_favorites')
    .select(`script:scripts!script_id(${PROFILE_SCRIPT_FIELDS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return flattenFavoriteScripts(data)
}

async function syncFacultyAndStudySelections(
  supabase: ReturnType<typeof createSupabaseClient>,
  profileId: string,
  selectedFacultyIds: unknown,
  selectedStudyIds: unknown
) {
  if (Array.isArray(selectedFacultyIds)) {
    await supabase
      .from('profile_faculties')
      .delete()
      .eq('profile_id', profileId)

    if (selectedFacultyIds.length > 0) {
      await supabase.from('profile_faculties').insert(
        selectedFacultyIds.map((facultyId: string) => ({
          profile_id: profileId,
          faculty_id: facultyId,
        }))
      )
    }
  }

  if (Array.isArray(selectedStudyIds)) {
    await supabase.from('profile_studies').delete().eq('profile_id', profileId)

    if (selectedStudyIds.length > 0) {
      await supabase.from('profile_studies').insert(
        selectedStudyIds.map((studyId: string) => ({
          profile_id: profileId,
          study_id: studyId,
        }))
      )
    }
  }
}

const profiles = new Hono<HonoEnv>()

/** Get all profiles (public) */
profiles.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, username, full_name, role, ${PROFILE_ACHIEVEMENTS_SELECT}, avatar_url, created_at, subjects:profile_subjects(subject_id, status, updated_at)`
    )
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json(data)
})

/** Get current user's profile */
profiles.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `*, ${PROFILE_ACADEMIC_SELECT}, ${PROFILE_SCRIPTS_SELECT}, ${PROFILE_FAVORITE_SCRIPTS_SELECT}`
    )
    .eq('id', user.id)
    .single()

  if (error) return profileQueryErrorResponse(c, error)

  const [scripts, favoriteScripts] = await Promise.all([
    attachScriptCommentCounts(c, data.scripts),
    attachScriptCommentCounts(c, flattenFavoriteScripts(data.favorite_scripts)),
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

/** Delete current user's profile */
profiles.delete('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { error } = await supabase.from('profiles').delete().eq('id', user.id)

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json({ success: true })
})

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
    fetchFavoriteScripts(c, data.id).then((rows) =>
      attachScriptCommentCounts(c, rows)
    ),
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
    fetchFavoriteScripts(c, data.id).then((rows) =>
      attachScriptCommentCounts(c, rows)
    ),
  ])
  if (!scripts || !favoriteScripts) {
    return c.json({ error: 'Unable to load this profile' }, 500)
  }
  return c.json({ ...data, scripts, favorite_scripts: favoriteScripts })
})

/** Update current user's profile */
profiles.patch('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { username, full_name, selected_faculty_ids, selected_study_ids } =
    await c.req.json()

  const usernameError = validateUsername(username)
  if (usernameError) return c.json({ error: usernameError }, 400)

  const { data, error } = await supabase
    .from('profiles')
    .update({ username, full_name })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Username already taken' }, 400)
    }
    return databaseErrorResponse(c, error)
  }

  await syncFacultyAndStudySelections(
    supabase,
    user.id,
    selected_faculty_ids,
    selected_study_ids
  )
  await revalidateCacheTags(c.env, profileMutationTags(user.id))

  return c.json({ success: true, profile: data })
})

/** Update any user's profile (admin only) */
profiles.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { username, full_name, selected_faculty_ids, selected_study_ids } =
    await c.req.json()

  const usernameError = validateUsername(username)
  if (usernameError) return c.json({ error: usernameError }, 400)

  const { data, error } = await supabase
    .from('profiles')
    .update({ username, full_name })
    .eq('id', targetId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Username already taken' }, 400)
    }
    return databaseErrorResponse(c, error)
  }

  await syncFacultyAndStudySelections(
    supabase,
    targetId,
    selected_faculty_ids,
    selected_study_ids
  )
  await revalidateCacheTags(c.env, profileMutationTags(targetId))

  return c.json({ success: true, profile: data })
})

/** Delete any user's profile (admin only) */
profiles.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { error } = await supabase.from('profiles').delete().eq('id', targetId)

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(targetId))
  return c.json({ success: true })
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
