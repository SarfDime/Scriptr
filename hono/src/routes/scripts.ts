import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import type { ScriptFileInput } from '../../../shared/types/api.types'
import type { PortableTextValue } from '../../../shared/types/portable-text.types'
import type {
  MyScriptSummary,
  ScriptFlaggedSummary,
  ScriptPatchResult,
  ScriptSummary,
} from '../../../shared/types/scripts.types'
import { isAdmin, isScriptFileInput } from '../../../shared/utils/api.utils'
import { getAttribute } from '../../../shared/utils/common-utils'
import {
  isPortableTextValue,
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextToPlainText,
} from '../../../shared/utils/portable-text.utils'
import {
  checkScriptsUploaded,
  checkTotalScriptDownloads,
} from '../lib/achievements'
import {
  revalidateCacheTags,
  scriptMutationTags,
} from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import { deleteR2Files } from '../lib/r2'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_SCRIPT_COLUMNS =
  'id, title, description, subject_id, professor_id, author_id, exam_session, additional_reading, vote_score, download_count, created_at, updated_at, comments:comments(count), files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, created_at)'

/**
 * Reused by every list/detail endpoint below (`/`, `/subject/:subjectId`,
 * `/top`, `/popular`, `/search`, `/:id`) and by `POST /`'s create + refetch
 * selects — one select string instead of the same literal duplicated per
 * route. `subject` carries its display name plus `sanity_id` (client-side Sanity queries
 * resolve faculty/university/professor metadata from it — see
 * `ARCHITECTURE.md §1`) and `faculty_id` (server-side faculty scoping only,
 * via `applySelectedFacultyScope` below — never returned for display).
 * Matches `ScriptSummary` in `shared/types/scripts.types.ts` exactly; keep
 * the two in sync if this changes.
 */
const SCRIPT_SUMMARY_SELECT = `
    ${PUBLIC_SCRIPT_COLUMNS},
    author:profiles!author_id(username, full_name, avatar_url),
    subject:subjects(name, sanity_id, study:studies(sanity_id, faculty:faculties(sanity_id, id)))
  `

function applySelectedFacultyScope<T extends ScriptSummary>(
  rows: Array<T> | null,
  selectedFacultyIds: Array<string> | null
) {
  if (!rows || !selectedFacultyIds || selectedFacultyIds.length === 0) {
    return rows ?? []
  }

  return rows.filter((row) => {
    const facultyId = row.subject?.study?.faculty?.id
    return !facultyId || selectedFacultyIds.includes(facultyId)
  })
}

/** Resolve the requester's dedupe identity for downloads: account, then IP, then device. */
async function resolveDownloadIdentity(c: Context<HonoEnv>) {
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()
  const ipAddress =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    null
  const deviceId = c.req.header('x-device-id') ?? null

  let identityKey: string | null = null
  if (sessionData.user) {
    identityKey = `account:${sessionData.user.id}`
  } else if (ipAddress) {
    identityKey = `ip:${ipAddress}`
  } else if (deviceId) {
    identityKey = `device:${deviceId}`
  }

  return {
    userId: sessionData.user?.id ?? null,
    ipAddress,
    deviceId,
    identityKey,
  }
}

async function getSelectedFacultyScope(
  supabase: ReturnType<typeof createSupabaseClient>
) {
  const { data: sessionData } = await supabase.auth.getUser()

  if (!sessionData.user) {
    return null
  }

  const { data } = await supabase
    .from('profile_faculties')
    .select('faculty_id')
    .eq('profile_id', sessionData.user.id)

  return data?.map(({ faculty_id }) => faculty_id) ?? []
}

function fuzzyScore(query: string, value: string) {
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedValue = value.toLowerCase()

  if (normalizedValue.includes(normalizedQuery)) return 1

  const queryWords = normalizedQuery.split(/\s+/)
  const valueWords = normalizedValue.split(/[^a-z0-9]+/).filter(Boolean)
  const wordScores = queryWords.map((queryWord) => {
    const bestDistance = Math.min(
      ...valueWords.map((valueWord) =>
        levenshteinDistance(queryWord, valueWord)
      )
    )
    const length = Math.max(queryWord.length, 1)
    return 1 - bestDistance / length
  })

  return (
    wordScores.reduce((total, score) => total + score, 0) / wordScores.length
  )
}

function toSearchableText(value: unknown) {
  return isPortableTextValue(value) ? portableTextToPlainText(value) : ''
}

function levenshteinDistance(left: string, right: string) {
  const previousRow = Array.from(
    { length: right.length + 1 },
    (_, index) => index
  )

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex]

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      currentRow[rightIndex] = Math.min(
        (currentRow[rightIndex - 1] ?? leftIndex) + 1,
        (previousRow[rightIndex] ?? rightIndex) + 1,
        (previousRow[rightIndex - 1] ?? rightIndex - 1) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      )
    }

    previousRow.splice(0, previousRow.length, ...currentRow)
  }

  return previousRow[right.length] ?? right.length
}

/**
 * POST /scripts body. Accepts both camelCase and snake_case for
 * subject/professor/examSession/additionalReading, matching the API's
 * existing dual-key tolerance, normalized before validation.
 */
const createScriptSchema = z
  .preprocess(
    (raw) => {
      if (typeof raw !== 'object' || raw === null) return raw
      const body = raw as Record<string, unknown>
      return {
        title: body.title,
        description: body.description ?? null,
        subjectId: body.subject_id ?? body.subjectId,
        professorId: body.professor_id ?? body.professorId,
        examSession: body.examSession ?? body.exam_session ?? null,
        additionalReading:
          body.additionalReading ?? body.additional_reading ?? [],
        files: body.files,
      }
    },
    z.object({
      title: z.custom<PortableTextValue>(isScriptTitlePortableTextValue, {
        message:
          'title must contain text and use supported Portable Text within 2 KB',
      }),
      description: z
        .custom<PortableTextValue>(isScriptDescriptionPortableTextValue, {
          message: 'description must use supported Portable Text within 50 KB',
        })
        .nullable(),
      subjectId: z.string().min(1, 'subjectId is required'),
      professorId: z.string().min(1, 'professorId is required'),
      examSession: z.string().nullable(),
      additionalReading: z.array(z.string()),
      files: z
        .array(
          z.custom<ScriptFileInput>(isScriptFileInput, {
            message: 'Invalid file input',
          })
        )
        .min(1, 'At least one file is required'),
    })
  )
  .refine((body) => portableTextToPlainText(body.title).length > 0, {
    message: 'Title cannot be empty',
    path: ['title'],
  })

const scripts = new Hono<HonoEnv>()

/** Get all scripts (public) */
scripts.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json<Array<ScriptSummary>>(
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
})

/** Get scripts by subject */
scripts.get('/subject/:subjectId', async (c) => {
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .eq('subject_id', subjectId)
    .order('vote_score', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json<Array<ScriptSummary>>(
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
})

/** Get top scripts (by vote score) */
scripts.get('/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .order('vote_score', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json<Array<ScriptSummary>>(
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
})

/** Get most downloaded scripts */
scripts.get('/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .order('download_count', { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json<Array<ScriptSummary>>(
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
})

/** Search scripts */
scripts.get('/search', async (c) => {
  const queryParam = c.req.query('q')

  if (!queryParam) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)

  if (error) return c.json({ error: error.message }, 500)

  const filteredData = applySelectedFacultyScope(data, selectedFacultyIds)

  const results = filteredData
    .map((script) => ({
      script,
      score: Math.max(
        fuzzyScore(queryParam, toSearchableText(script.title)),
        fuzzyScore(queryParam, toSearchableText(script.description))
      ),
    }))
    .filter(({ score }) => score >= 0.45)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.script.vote_score - left.script.vote_score
    )
    .map(({ script }) => script)

  return c.json<Array<ScriptSummary>>(results)
})

/** Get all scripts for a user */
scripts.get('/my-scripts', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
        *,
        subject:subjects(name, study:studies(name))
      `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json<{ scripts: Array<MyScriptSummary> }>({ scripts: data })
})

/** Get a single script by ID */
scripts.get('/:id', async (c) => {
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .eq('id', scriptId)
    .single()

  if (error) return c.json({ error: error.message }, 404)

  const facultyId = data.subject?.study?.faculty?.id
  if (
    selectedFacultyIds &&
    selectedFacultyIds.length > 0 &&
    (!facultyId || !selectedFacultyIds.includes(facultyId))
  ) {
    return c.json(
      { error: 'Script not available in your selected faculties' },
      404
    )
  }

  return c.json<ScriptSummary>(data)
})

/** Insert a new script */
scripts.post(
  '/',
  authMiddleware,
  zValidator('json', createScriptSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? 'Invalid script' },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    const supabase = createSupabaseClient(c)

    const {
      title,
      description,
      subjectId,
      professorId,
      examSession,
      additionalReading,
      files,
    } = c.req.valid('json')

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        title,
        description,
        subject_id: subjectId,
        professor_id: professorId,
        author_id: user.id,
        exam_session: examSession,
        additional_reading: additionalReading,
        vote_score: 0,
        download_count: 0,
      })
      .select('id')
      .single()

    if (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to save script record',
        error,
      })

      try {
        await deleteR2Files(
          c,
          files.map(({ bucket, fileKey }) => ({ bucket, fileKey }))
        )
      } catch (cleanupError) {
        honoLog({
          logLevel: 'error',
          message: 'Failed to clean up uploaded R2 files after script failure',
          error: cleanupError,
        })
      }

      if (error.code === '42501') {
        return c.json({ error: 'You are not allowed to create scripts' }, 403)
      }
      if (error.code === '23514') {
        return c.json(
          { error: 'Script data violates a database constraint' },
          400
        )
      }
      if (error.code === '23503') {
        return c.json(
          { error: 'The selected subject or professor is no longer available' },
          409
        )
      }

      return c.json({ error: 'Failed to save script record' }, 500)
    }

    const { error: filesError } = await supabase.from('script_files').insert(
      files.map((file, position) => ({
        script_id: data.id,
        file_url: file.fileKey,
        file_type: file.fileType,
        file_size_bytes: file.fileSizeBytes,
        bucket: file.bucket,
        position,
      }))
    )

    if (filesError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to save script files',
        error: filesError,
      })
      await supabase.from('scripts').delete().eq('id', data.id)
      try {
        await deleteR2Files(
          c,
          files.map(({ bucket, fileKey }) => ({ bucket, fileKey }))
        )
      } catch (cleanupError) {
        honoLog({
          logLevel: 'error',
          message:
            'Failed to clean up uploaded R2 files after file record failure',
          error: cleanupError,
        })
      }
      if (filesError.code === '42501') {
        return c.json({ error: 'You are not allowed to attach files' }, 403)
      }
      if (filesError.code === '23503' || filesError.code === '23514') {
        return c.json({ error: 'Invalid script file data' }, 400)
      }
      return c.json({ error: 'Failed to save script files' }, 500)
    }

    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: data.id,
        subject_id: subjectId,
        author_id: user.id,
      })
    )
    await checkScriptsUploaded(c, user.id)

    return c.json<{ success: true; script: { id: string }; message: string }>({
      success: true,
      script: { id: data.id },
      message: 'Script uploaded successfully',
    })
  }
)

/** Update a script (only by author or admin) */
scripts.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { title, description, additional_reading } = await c.req.json()

  if (
    (title !== undefined && !isScriptTitlePortableTextValue(title)) ||
    (description !== undefined &&
      description !== null &&
      !isScriptDescriptionPortableTextValue(description)) ||
    (additional_reading !== undefined &&
      (!Array.isArray(additional_reading) ||
        !additional_reading.every((url) => typeof url === 'string')))
  ) {
    return c.json({ error: 'Invalid script update' }, 400)
  }

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase.from('scripts').select('author_id').eq('id', scriptId).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or admin
  if (script?.author_id !== user.id && !isAdmin(profile?.role)) {
    return c.json(
      { error: 'Unauthorized: You can only edit your own scripts' },
      403
    )
  }

  const { data, error } = await supabase
    .from('scripts')
    .update({
      ...getAttribute(title !== undefined, 'title', title),
      ...getAttribute(description !== undefined, 'description', description),
      ...getAttribute(
        Array.isArray(additional_reading),
        'additional_reading',
        additional_reading
      ),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scriptId)
    .select(`
        *,
        author:profiles!author_id(username, full_name, avatar_url),
        subject:subjects(name, study:studies(name))
      `)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  await revalidateCacheTags(c.env, scriptMutationTags(data))

  return c.json<{ success: boolean; script: ScriptPatchResult }>({
    success: true,
    script: data,
  })
})

/** Delete a script (only by author or admin) */
scripts.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase
      .from('scripts')
      .select('author_id, subject_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or admin
  if (script?.author_id !== user.id && !isAdmin(profile?.role)) {
    return c.json(
      { error: 'Unauthorized: You can only delete your own scripts' },
      403
    )
  }

  const { data: files } = await supabase
    .from('script_files')
    .select('file_url, bucket')
    .eq('script_id', scriptId)

  const { error } = await supabase.from('scripts').delete().eq('id', scriptId)

  if (error) return c.json({ error: error.message }, 500)

  try {
    await deleteR2Files(
      c,
      (files ?? []).map((file) => ({
        fileKey: file.file_url,
        bucket: file.bucket,
      }))
    )
  } catch (cleanupError) {
    honoLog({
      logLevel: 'error',
      message: 'Script deleted but R2 file cleanup failed',
      error: cleanupError,
    })
  }

  if (script?.subject_id) {
    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: scriptId,
        subject_id: script.subject_id,
        author_id: script.author_id,
      })
    )
  }

  return c.json({ success: true, message: 'Script deleted successfully' })
})

/** Record a download, deduplicated per identity (account, then IP, then device) */
scripts.post('/:id/download', async (c) => {
  const scriptId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data: script } = await supabase
    .from('scripts')
    .select('download_count, author_id, subject_id')
    .eq('id', scriptId)
    .single()

  if (!script) {
    return c.json({ error: 'Script not found' }, 404)
  }

  const { userId, ipAddress, deviceId, identityKey } =
    await resolveDownloadIdentity(c)

  if (!identityKey) {
    const { error } = await supabase
      .from('scripts')
      .update({ download_count: (script.download_count || 0) + 1 })
      .eq('id', scriptId)

    if (error) return c.json({ error: error.message }, 500)
    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: scriptId,
        subject_id: script.subject_id,
        author_id: script.author_id,
      })
    )
    await checkTotalScriptDownloads(c, script.author_id)
    return c.json({ success: true, counted: true })
  }

  const { error: insertError } = await supabase.from('download_events').insert({
    script_id: scriptId,
    user_id: userId,
    ip_address: ipAddress,
    device_id: deviceId,
    identity_key: identityKey,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return c.json({ success: true, counted: false })
    }
    return c.json({ error: insertError.message }, 500)
  }

  const { error: updateError } = await supabase
    .from('scripts')
    .update({ download_count: (script.download_count || 0) + 1 })
    .eq('id', scriptId)

  if (updateError) return c.json({ error: updateError.message }, 500)
  await revalidateCacheTags(
    c.env,
    scriptMutationTags({
      id: scriptId,
      subject_id: script.subject_id,
      author_id: script.author_id,
    })
  )
  await checkTotalScriptDownloads(c, script.author_id)
  return c.json({ success: true, counted: true })
})

/** Get flagged scripts (admin only) */
scripts.get('/flagged/all', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const { data, error } = await supabase
    .from('scripts')
    .select(`
        *,
        author:profiles!author_id(username, full_name, avatar_url),
        subject:subjects(name, study:studies(name)),
        flags:flags(
          *,
          reporter:profiles!reporter_id(username)
        )
      `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json<Array<ScriptFlaggedSummary>>(data)
})

export default scripts
