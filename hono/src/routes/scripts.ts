import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import type { ScriptFileInput } from '../../../shared/types/api.types'
import type { PortableTextValue } from '../../../shared/types/portable-text.types'
import type {
  MyScriptSummary,
  ScriptAttachFilesResponse,
  ScriptDeleteResponse,
  ScriptFlaggedSummary,
  ScriptPatchResponse,
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
import { databaseErrorResponse, requiredParam } from '../lib/request'
import { verifyReportedFiles } from '../lib/script-files'
import { isOwnUploadKey } from '../lib/storage-scope'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Excludes is_flagged and the comments aggregate, which uses the separately
// permissioned get_script_comment_counts RPC.
const PUBLIC_SCRIPT_COLUMNS =
  'id, title, description, subject_id, professor_id, author_id, exam_session, additional_reading, vote_score, download_count, created_at, updated_at, files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)'

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

function applySelectedFacultyScope<T extends Pick<ScriptSummary, 'subject'>>(
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

async function attachCommentCounts(
  supabase: ReturnType<typeof createSupabaseClient>,
  rows: Array<Omit<ScriptSummary, 'comments'>>
): Promise<Array<ScriptSummary> | null> {
  const counts = new Map<string, number>()
  const batchSize = 100

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const scriptIds = rows.slice(offset, offset + batchSize).map(({ id }) => id)
    const { data, error } = await supabase.rpc('get_script_comment_counts', {
      p_script_ids: scriptIds,
    })

    if (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to fetch script comment counts',
        error,
      })
      return null
    }

    for (const row of data) {
      counts.set(row.script_id, row.comment_count)
    }
  }

  return rows.map((row) => ({
    ...row,
    comments: [{ count: counts.get(row.id) ?? 0 }],
  }))
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
        .optional()
        .default([]),
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

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(
    supabase,
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
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

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(
    supabase,
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
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

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(
    supabase,
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
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

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(
    supabase,
    applySelectedFacultyScope(data, selectedFacultyIds)
  )
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
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

  if (error) return databaseErrorResponse(c, error)

  const scopedData = applySelectedFacultyScope(data, selectedFacultyIds)
  const filteredData = await attachCommentCounts(supabase, scopedData)
  if (!filteredData) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }

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

  if (error) return databaseErrorResponse(c, error)
  return c.json<{ scripts: Array<MyScriptSummary> }>({ scripts: data })
})

/**
 * Closes the gap a removed file leaves in `position`, so a script's files stay
 * numbered 0..n-1 and their "File N" labels never skip. `script_files` has no
 * UPDATE policy, so no caller can do this through RLS and the service-role
 * client is the only path. It only runs after the session client's DELETE
 * (RLS: author or admin) has succeeded, so the caller is already authorized.
 * Best effort: the file is already gone, so a failure only leaves a cosmetic
 * gap, never an error for the caller.
 */
const compactScriptFilePositions = async (
  c: Context<HonoEnv>,
  scriptId: string
) => {
  const internal = createInternalSupabaseClient(c)

  const { data: remaining, error } = await internal
    .from('script_files')
    .select('id, position')
    .eq('script_id', scriptId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !remaining) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to read script files for renumbering',
      error,
    })
    return
  }

  const outOfPlace = remaining.flatMap((file, index) =>
    file.position === index ? [] : [{ id: file.id, position: index }]
  )

  const results = await Promise.all(
    outOfPlace.map(({ id, position }) =>
      internal.from('script_files').update({ position }).eq('id', id)
    )
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to renumber script files after removal',
      error: failed.error,
    })
  }
}

/** Remove a single file from a script (author or admin only) */
scripts.delete('/:scriptId/files/:fileId', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const fileId = requiredParam(c, 'fileId')
  const supabase = createSupabaseClient(c)

  const [
    { data: file, error: fileError },
    { data: script },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('script_files')
      .select('id, file_url, bucket, script_id')
      .eq('id', fileId)
      .eq('script_id', scriptId)
      .single(),
    supabase
      .from('scripts')
      .select('author_id, subject_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (fileError || !file) {
    return c.json({ error: 'Script file not found' }, 404)
  }

  if (script?.author_id !== user.id && !isAdmin(profile?.role)) {
    return c.json(
      {
        error: 'Unauthorized: You can only remove files from your own scripts',
      },
      403
    )
  }

  const { error } = await supabase
    .from('script_files')
    .delete()
    .eq('id', fileId)
    .eq('script_id', scriptId)

  if (error) return databaseErrorResponse(c, error)

  try {
    await deleteR2Files(c, [{ bucket: file.bucket, fileKey: file.file_url }])
  } catch (cleanupError) {
    honoLog({
      logLevel: 'error',
      message: 'Script file deleted from DB but R2 cleanup failed',
      error: cleanupError,
    })
  }

  await compactScriptFilePositions(c, scriptId)

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

  return c.json<ScriptDeleteResponse>({
    success: true,
    message: 'Script file deleted successfully',
  })
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

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Script not found' }, 404)
    }

    honoLog({
      logLevel: 'error',
      message: 'Failed to fetch script',
      error,
    })
    return c.json({ error: 'Failed to fetch script' }, 500)
  }

  const scriptsWithCounts = await attachCommentCounts(supabase, [data])
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch script' }, 500)
  }
  const [scriptWithCounts] = scriptsWithCounts
  if (!scriptWithCounts) {
    return c.json({ error: 'Failed to fetch script' }, 500)
  }

  const facultyId = scriptWithCounts.subject?.study?.faculty?.id
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

  return c.json<ScriptSummary>(scriptWithCounts)
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
      files: reportedFiles,
    } = c.req.valid('json')

    // The client's file list is verified, not trusted: in the caller's own
    // scope, really in R2, and stored with the size R2 reports.
    const verified = await verifyReportedFiles(
      c,
      user.id,
      subjectId,
      reportedFiles
    )
    if (!verified.ok) {
      return c.json({ error: verified.error }, verified.status)
    }
    const files = verified.files

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
        file_name: file.fileName ?? null,
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

/** POST /scripts/:id/files body: files already stored through
 * POST /file-ops/finalize. */
const attachScriptFilesSchema = z.object({
  files: z
    .array(
      z.custom<ScriptFileInput>(isScriptFileInput, {
        message: 'Invalid file input',
      })
    )
    .min(1, 'At least one file is required'),
})

/** Attach already-uploaded files to an existing script (author or admin) */
scripts.post(
  '/:id/files',
  authMiddleware,
  zValidator('json', attachScriptFilesSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? 'Invalid files' },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    const scriptId = requiredParam(c, 'id')
    const { files: reportedFiles } = c.req.valid('json')
    const supabase = createSupabaseClient(c)

    // The files are already in R2 by now, so every failure below has to take
    // them back out again. Only objects under the caller's own user id are ever
    // deleted: the keys come from the client, and this runs on failure paths
    // (script missing, not the author) before they have been checked at all.
    const discardUploads = async () => {
      try {
        await deleteR2Files(
          c,
          reportedFiles
            .filter(({ fileKey }) => isOwnUploadKey(fileKey, user.id))
            .map(({ bucket, fileKey }) => ({ bucket, fileKey }))
        )
      } catch (cleanupError) {
        honoLog({
          logLevel: 'error',
          message: 'Failed to clean up uploaded R2 files after attach failure',
          error: cleanupError,
        })
      }
    }

    const [{ data: script }, { data: profile }] = await Promise.all([
      supabase
        .from('scripts')
        .select('author_id, subject_id')
        .eq('id', scriptId)
        .single(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ])

    if (!script) {
      await discardUploads()
      return c.json({ error: 'Script not found' }, 404)
    }

    if (script.author_id !== user.id && !isAdmin(profile?.role)) {
      await discardUploads()
      return c.json(
        { error: 'Unauthorized: You can only add files to your own scripts' },
        403
      )
    }

    // Same checks as creating a script: in the caller's own scope for this
    // script's subject, really in R2, and stored with the size R2 reports. An
    // admin attaching to someone else's script uploaded under their own id, so
    // the caller's id is the right one here too.
    const verified = await verifyReportedFiles(
      c,
      user.id,
      script.subject_id,
      reportedFiles
    )
    if (!verified.ok) {
      return c.json({ error: verified.error }, verified.status)
    }
    const files = verified.files

    const { data: lastFile } = await supabase
      .from('script_files')
      .select('position')
      .eq('script_id', scriptId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const firstPosition = lastFile ? lastFile.position + 1 : 0

    // RLS is the real gate: the author must not be restricted (admins are
    // exempt), otherwise the insert fails with 42501.
    const { data: inserted, error } = await supabase
      .from('script_files')
      .insert(
        files.map((file, index) => ({
          script_id: scriptId,
          file_url: file.fileKey,
          file_type: file.fileType,
          file_size_bytes: file.fileSizeBytes,
          bucket: file.bucket,
          file_name: file.fileName ?? null,
          position: firstPosition + index,
        }))
      )
      .select(
        'id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at'
      )

    if (error || !inserted) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to attach script files',
        error,
      })
      await discardUploads()

      if (error?.code === '42501') {
        return c.json(
          { error: 'Your account is restricted from adding files' },
          403
        )
      }
      if (error?.code === '23503' || error?.code === '23514') {
        return c.json({ error: 'Invalid script file data' }, 400)
      }
      return c.json({ error: 'Failed to save script files' }, 500)
    }

    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: scriptId,
        subject_id: script.subject_id,
        author_id: script.author_id,
      })
    )

    return c.json<ScriptAttachFilesResponse>({
      success: true,
      files: inserted,
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

  if (error) {
    // A restricted author's UPDATE matches no rows (`is_restricted()` is in the
    // policy's USING clause), which `.single()` reports as PGRST116 rather than
    // 42501. The script lookup and author/admin check above already passed and
    // admins always satisfy the policy, so this can only be a restriction.
    if (error.code === 'PGRST116') {
      return c.json(
        { error: 'Your account is restricted from editing scripts' },
        403
      )
    }
    return databaseErrorResponse(c, error)
  }

  await revalidateCacheTags(c.env, scriptMutationTags(data))

  return c.json<ScriptPatchResponse>({
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

  if (error) return databaseErrorResponse(c, error)

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

  return c.json<ScriptDeleteResponse>({
    success: true,
    message: 'Script deleted successfully',
  })
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

    if (error) return databaseErrorResponse(c, error)
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
    return databaseErrorResponse(c, insertError)
  }

  const { error: updateError } = await supabase
    .from('scripts')
    .update({ download_count: (script.download_count || 0) + 1 })
    .eq('id', scriptId)

  if (updateError) return databaseErrorResponse(c, updateError)
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

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<ScriptFlaggedSummary>>(data)
})

export default scripts
