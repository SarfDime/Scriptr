import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { NOTIFICATIONS_STRINGS } from '../../../shared/strings/notifications-strings'
import type { ExamSession } from '../../../shared/types/academic.types'
import type { ScriptFileInput } from '../../../shared/types/api.types'
import type { PortableTextValue } from '../../../shared/types/portable-text.types'
import type {
  DownloadResponse,
  MyScriptSummary,
  ScriptAttachFilesResponse,
  ScriptDeleteResponse,
  ScriptFlaggedSummary,
  ScriptPatchResponse,
  ScriptSummary,
  ScriptsListResponse,
} from '../../../shared/types/scripts.types'
import { isOwner, isScriptFileInput } from '../../../shared/utils/api.utils'
import {
  isPortableTextValue,
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextToPlainText,
} from '../../../shared/utils/portable-text.utils'
import {
  isExamSession,
  isValidScriptYear,
} from '../../../shared/utils/script-session.utils'
import { buildScriptSlug, isUuid } from '../../../shared/utils/slug.utils'
import { hasUnsupportedScript } from '../../../shared/utils/text-language.utils'
import {
  checkScriptsUploaded,
  checkTotalScriptDownloads,
} from '../lib/achievements'
import { requireAdminAccess } from '../lib/admin-access'
import {
  revalidateCacheTags,
  scriptMutationTags,
} from '../lib/cache-revalidate'
import { honoLog } from '../lib/logger'
import { notifyProfileBestEffort } from '../lib/notifications'
import { deleteR2Files } from '../lib/r2'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import {
  hasAnyStudyRole,
  requireOwner,
  requireStudyRole,
} from '../lib/require-admin'
import { verifyReportedFiles } from '../lib/script-files'
import { isOwnUploadKey } from '../lib/storage-scope'
import {
  canWriteInStudy,
  STUDY_WRITE_DENIED_MESSAGE,
} from '../lib/study-access'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Excludes is_flagged and the comments aggregate, which uses the separately
// permissioned get_script_comment_counts RPC.
const PUBLIC_SCRIPT_COLUMNS =
  'id, slug, title, description, subject_id, professor_id, author_id, study_id, exam_session, exam_year, additional_reading, vote_score, download_count, created_at, updated_at, files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)'

/**
 * Reused by every list/detail endpoint below (`/`, `/subject/:subjectId`,
 * `/top`, `/popular`, `/search`, `/:id`) and by `POST /`'s create + refetch
 * selects — one select string instead of the same literal duplicated per
 * route. `subject` carries its display name plus `sanity_id`, which client
 * Sanity queries use to resolve the subject's faculty/university/professor
 * metadata (see `docs/ARCHITECTURE-SYSTEM-OVERVIEW.md`). There is deliberately
 * no faculty join: scripts are not scoped by faculty (studies are the real
 * academic scope). Matches `ScriptSummary` in `shared/types/scripts.types.ts`
 * exactly; keep the two in sync if this changes.
 */
const SCRIPT_SUMMARY_SELECT = `
    ${PUBLIC_SCRIPT_COLUMNS},
    author:profiles!author_id(username, full_name, avatar_url),
    subject:subjects(name, sanity_id, study:studies(sanity_id, site_slug))
  `

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

/** The project is not localized yet, so authored text is Latin or Cyrillic
 * only — see `hasUnsupportedScript`. */
/** Bounded like the comment routes: the caller asks for a page, not the table. */
const SCRIPTS_PAGE_SIZE = 50

const UNSUPPORTED_SCRIPT_MESSAGE =
  'Use Latin or Cyrillic letters only. Other languages are not supported yet.'

/**
 * POST /scripts body. Accepts both camelCase and snake_case for
 * subject/professor/examSession/examYear/additionalReading, matching the API's
 * existing dual-key tolerance, normalized before validation.
 *
 * `examSession` is one of `EXAM_SESSIONS` or `null` for the general (all
 * sessions) option; `examYear` is `null` for general (all years) and otherwise
 * has to be a year that session has already reached.
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
        examYear: body.examYear ?? body.exam_year ?? null,
        additionalReading:
          body.additionalReading ?? body.additional_reading ?? [],
        files: body.files,
      }
    },
    z
      .object({
        title: z.custom<PortableTextValue>(isScriptTitlePortableTextValue, {
          message:
            'title must contain text and use supported Portable Text within 2 KB',
        }),
        description: z
          .custom<PortableTextValue>(isScriptDescriptionPortableTextValue, {
            message:
              'description must use supported Portable Text within 50 KB',
          })
          .nullable(),
        subjectId: z.string().min(1, 'subjectId is required'),
        professorId: z.string().min(1, 'professorId is required'),
        examSession: z
          .custom<ExamSession>(isExamSession, {
            message: 'examSession must be january, june or september',
          })
          .nullable(),
        examYear: z.number().int().nullable(),
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
      .refine(
        (body) =>
          body.examYear === null ||
          isValidScriptYear(body.examSession, body.examYear),
        {
          message: 'examYear is out of range for the selected exam session',
          path: ['examYear'],
        }
      )
  )
  .refine((body) => portableTextToPlainText(body.title).length > 0, {
    message: 'Title cannot be empty',
    path: ['title'],
  })
  .refine(
    (body) => !hasUnsupportedScript(portableTextToPlainText(body.title)),
    { message: UNSUPPORTED_SCRIPT_MESSAGE, path: ['title'] }
  )
  .refine(
    (body) =>
      body.description === null ||
      !hasUnsupportedScript(portableTextToPlainText(body.description)),
    { message: UNSUPPORTED_SCRIPT_MESSAGE, path: ['description'] }
  )

/** The optional `?study=` narrowing the public feeds accept: absent means the
 * catalog sees every study, and a value that is not an id is a caller mistake
 * the routes answer with a 400 rather than silently widening the read. */
const readStudyFilter = (
  value: string | undefined
): { studyId: string | null } | { invalid: true } => {
  if (!value) return { studyId: null }
  return isUuid(value) ? { studyId: value } : { invalid: true }
}

const scripts = new Hono<HonoEnv>()

/** One page of every script, newest first. Admin-only: the response carries
 * every script with its files, author and comment count, and nothing in the app
 * reads it anonymously — the sitemap gets compact entries from the internal API
 * instead. */
scripts.get('/', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  if (!(await requireOwner(supabase, user.id))) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  const limit = Number(c.req.query('limit') ?? SCRIPTS_PAGE_SIZE)
  const offset = Number(c.req.query('offset') ?? 0)
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > SCRIPTS_PAGE_SIZE ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return c.json({ error: 'Invalid pagination parameters' }, 400)
  }

  const scope = readStudyFilter(c.req.query('study'))
  if ('invalid' in scope) {
    return c.json({ error: 'Invalid study filter' }, 400)
  }

  let query = supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (scope.studyId) query = query.eq('study_id', scope.studyId)

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(supabase, data)
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }

  const totalCount = count ?? scriptsWithCounts.length
  return c.json<ScriptsListResponse>({
    items: scriptsWithCounts,
    hasMore: offset + scriptsWithCounts.length < totalCount,
    totalCount,
  })
})

/** Get scripts by subject */
scripts.get('/subject/:subjectId', async (c) => {
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .eq('subject_id', subjectId)
    .order('vote_score', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(supabase, data)
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
})

/**
 * Get a study's scripts. A script carries its study (`scripts.study_id`), so
 * the study site's home lists its own content from one read, newest-voted
 * first, and RLS still decides what a viewer may see.
 */
scripts.get('/study/:studyId', async (c) => {
  const studyId = requiredParam(c, 'studyId')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .eq('study_id', studyId)
    .order('vote_score', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(supabase, data)
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
})

/** Get top scripts (by vote score) */
scripts.get('/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const scope = readStudyFilter(c.req.query('study'))
  if ('invalid' in scope) {
    return c.json({ error: 'Invalid study filter' }, 400)
  }
  const supabase = createSupabaseClient(c)

  let query = supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .order('vote_score', { ascending: false })

  if (scope.studyId) query = query.eq('study_id', scope.studyId)

  const { data, error } = await query.limit(limit)

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(supabase, data)
  if (!scriptsWithCounts) {
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
  return c.json<Array<ScriptSummary>>(scriptsWithCounts)
})

/** Get most downloaded scripts */
scripts.get('/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const scope = readStudyFilter(c.req.query('study'))
  if ('invalid' in scope) {
    return c.json({ error: 'Invalid study filter' }, 400)
  }
  const supabase = createSupabaseClient(c)

  let query = supabase
    .from('scripts')
    .select(SCRIPT_SUMMARY_SELECT)
    .order('download_count', { ascending: false })

  if (scope.studyId) query = query.eq('study_id', scope.studyId)

  const { data, error } = await query.limit(limit)

  if (error) return databaseErrorResponse(c, error)
  const scriptsWithCounts = await attachCommentCounts(supabase, data)
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

  const scope = readStudyFilter(c.req.query('study'))
  if ('invalid' in scope) {
    return c.json({ error: 'Invalid study filter' }, 400)
  }
  const supabase = createSupabaseClient(c)

  let query = supabase.from('scripts').select(SCRIPT_SUMMARY_SELECT)
  if (scope.studyId) query = query.eq('study_id', scope.studyId)

  const { data, error } = await query

  if (error) return databaseErrorResponse(c, error)

  const filteredData = await attachCommentCounts(supabase, data)
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
      .select('author_id, subject_id, study_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (fileError || !file) {
    return c.json({ error: 'Script file not found' }, 404)
  }

  if (
    script?.author_id !== user.id &&
    !isOwner(profile?.role) &&
    !(await requireStudyRole(
      supabase,
      user.id,
      script?.study_id ?? null,
      'moderator'
    ))
  ) {
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
        study_id: script.study_id,
      })
    )
  }

  return c.json<ScriptDeleteResponse>({
    success: true,
    message: 'Script file deleted successfully',
  })
})

/** Get a single script by slug, or by id for links minted before slugs existed */
scripts.get('/:id', async (c) => {
  const identifier = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const query = supabase.from('scripts').select(SCRIPT_SUMMARY_SELECT)
  const { data, error } = await (isUuid(identifier)
    ? query.eq('id', identifier)
    : query.eq('slug', identifier)
  ).single()

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
      examYear,
      additionalReading,
      files: reportedFiles,
    } = c.req.valid('json')

    // The study is denormalised onto the script for feeds, search and RLS, and
    // the composite key checks it against the subject. A trigger keeps it right
    // for every other writer; this path states it because the column is `not
    // null`, and the read doubles as the subject check.
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('study_id')
      .eq('id', subjectId)
      .maybeSingle()

    if (subjectError) return databaseErrorResponse(c, subjectError)
    if (!subject) return c.json({ error: 'Subject not found' }, 400)

    // Resolved before the file check so a caller with no relationship to the
    // study is turned away without an R2 round trip.
    if (!(await canWriteInStudy(supabase, user.id, subject.study_id))) {
      return c.json({ error: STUDY_WRITE_DENIED_MESSAGE }, 403)
    }

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

    // The id is minted here rather than by the column default so the slug can
    // be derived from it in the same insert: the suffix is what makes two
    // identically titled scripts distinct, and the slug is never rewritten.
    const scriptId = crypto.randomUUID()

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        id: scriptId,
        slug: buildScriptSlug(portableTextToPlainText(title), scriptId),
        title,
        description,
        subject_id: subjectId,
        study_id: subject.study_id,
        professor_id: professorId,
        author_id: user.id,
        exam_session: examSession,
        exam_year: examYear,
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

    // Award before invalidating: an award created after the revalidation can
    // leave the force-cached public profile (tag `profiles:public`) stale.
    await checkScriptsUploaded(c, user.id, subject.study_id)
    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: data.id,
        subject_id: subjectId,
        author_id: user.id,
        study_id: subject.study_id,
      })
    )

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
        .select('author_id, subject_id, study_id')
        .eq('id', scriptId)
        .single(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ])

    if (!script) {
      await discardUploads()
      return c.json({ error: 'Script not found' }, 404)
    }

    if (
      script.author_id !== user.id &&
      !isOwner(profile?.role) &&
      !(await requireStudyRole(supabase, user.id, script.study_id, 'moderator'))
    ) {
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
        study_id: script.study_id,
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

  const { title, description, additional_reading, exam_session, exam_year } =
    await c.req.json()

  const writtenText: Array<unknown> = [title, description]
  if (
    writtenText.some(
      (value) =>
        isPortableTextValue(value) &&
        hasUnsupportedScript(portableTextToPlainText(value))
    )
  ) {
    return c.json({ error: UNSUPPORTED_SCRIPT_MESSAGE }, 400)
  }

  if (
    (title !== undefined && !isScriptTitlePortableTextValue(title)) ||
    (description !== undefined &&
      description !== null &&
      !isScriptDescriptionPortableTextValue(description)) ||
    (additional_reading !== undefined &&
      (!Array.isArray(additional_reading) ||
        !additional_reading.every((url) => typeof url === 'string'))) ||
    (exam_session !== undefined &&
      exam_session !== null &&
      !isExamSession(exam_session)) ||
    (exam_year !== undefined &&
      exam_year !== null &&
      (typeof exam_year !== 'number' || !Number.isInteger(exam_year)))
  ) {
    return c.json({ error: 'Invalid script update' }, 400)
  }

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase
      .from('scripts')
      .select('author_id, exam_session, exam_year, study_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or admin
  if (
    script?.author_id !== user.id &&
    !isOwner(profile?.role) &&
    !(await requireStudyRole(
      supabase,
      user.id,
      script?.study_id ?? null,
      'moderator'
    ))
  ) {
    return c.json(
      { error: 'Unauthorized: You can only edit your own scripts' },
      403
    )
  }

  // The year is validated against the session it will end up with, not only
  // against the one sent in this request: a year-only update still has to fit
  // the stored session, and a session-only update must not leave a year behind
  // that the new session has not reached yet.
  const storedSession = isExamSession(script?.exam_session)
    ? script.exam_session
    : null
  const nextSession =
    exam_session !== undefined
      ? (exam_session as ExamSession | null)
      : storedSession
  const storedYear = script?.exam_year ?? null

  if (
    exam_year !== undefined &&
    exam_year !== null &&
    !isValidScriptYear(nextSession, exam_year)
  ) {
    return c.json(
      { error: 'exam_year is out of range for the selected exam session' },
      400
    )
  }

  const clearStaleYear =
    exam_session !== undefined &&
    exam_year === undefined &&
    storedYear !== null &&
    !isValidScriptYear(nextSession, storedYear)

  const { data, error } = await supabase
    .from('scripts')
    .update({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(Array.isArray(additional_reading) ? { additional_reading } : {}),
      ...(exam_session !== undefined ? { exam_session: nextSession } : {}),
      ...(exam_year !== undefined ? { exam_year } : {}),
      ...(clearStaleYear ? { exam_year: null } : {}),
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
      .select('author_id, subject_id, title, study_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!script) return c.json({ error: 'Script not found' }, 404)

  // Author, owner, or a moderator of the study this script belongs to.
  const canModerate =
    isOwner(profile?.role) ||
    (await requireStudyRole(supabase, user.id, script.study_id, 'moderator'))
  if (script.author_id !== user.id && !canModerate) {
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

  if (script.subject_id) {
    await revalidateCacheTags(
      c.env,
      scriptMutationTags({
        id: scriptId,
        subject_id: script.subject_id,
        author_id: script.author_id,
        study_id: script.study_id,
      })
    )
  }

  if (canModerate && script.author_id !== user.id) {
    const title = isPortableTextValue(script.title)
      ? portableTextToPlainText(script.title).trim() || 'Script'
      : 'Script'
    await notifyProfileBestEffort(c, script.author_id, {
      type: 'content_removed',
      title: NOTIFICATIONS_STRINGS.contentRemovedTitle(title),
      body: NOTIFICATIONS_STRINGS.contentRemovedBody('script'),
      data: { target_kind: 'script', title },
      studyId: script.study_id,
    })
  }

  return c.json<ScriptDeleteResponse>({
    success: true,
    message: 'Script deleted successfully',
  })
})

/**
 * Tail of a counted download: atomic increment -> award check -> cache
 * revalidation -> response. The award check runs before revalidation so a
 * freshly created award is already in the data the invalidated public profile
 * re-fetches. The check is best-effort and never fails the request.
 */
async function finishCountedDownload(
  c: Context<HonoEnv>,
  script: Parameters<typeof scriptMutationTags>[0],
  /** The dedupe row this call wrote, if any, so a failed increment can undo it
   * instead of leaving the download permanently marked as already counted. */
  recordedIdentityKey: string | null
) {
  const supabase = createInternalSupabaseClient(c)
  const { error } = await supabase.rpc('increment_script_download_count', {
    p_script_id: script.id,
  })
  if (error) {
    if (recordedIdentityKey) {
      const { error: rollbackError } = await supabase
        .from('download_events')
        .delete()
        .eq('script_id', script.id)
        .eq('identity_key', recordedIdentityKey)
      if (rollbackError) {
        honoLog({
          logLevel: 'error',
          message: 'Failed to roll back a download event after a failed count',
          error: rollbackError,
        })
      }
    }
    return databaseErrorResponse(c, error)
  }

  await checkTotalScriptDownloads(c, script.author_id, script.study_id ?? null)
  await revalidateCacheTags(c.env, scriptMutationTags(script))
  return c.json<DownloadResponse>({ success: true, counted: true })
}

/** Record a download, deduplicated per identity (account, then IP, then device) */
scripts.post('/:id/download', async (c) => {
  const scriptId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data: script } = await supabase
    .from('scripts')
    .select('author_id, subject_id, study_id')
    .eq('id', scriptId)
    .single()

  if (!script) {
    return c.json({ error: 'Script not found' }, 404)
  }

  const { userId, ipAddress, deviceId, identityKey } =
    await resolveDownloadIdentity(c)

  // A signed-in author downloading their own script is never counted. Anonymous
  // self-downloads can't be told apart from anyone else's, so they still count.
  if (userId && userId === script.author_id) {
    return c.json<DownloadResponse>({ success: true, counted: false })
  }

  const countedScript = {
    id: scriptId,
    subject_id: script.subject_id,
    author_id: script.author_id,
  }

  if (!identityKey) return finishCountedDownload(c, countedScript, null)

  const { error: insertError } = await supabase.from('download_events').insert({
    script_id: scriptId,
    user_id: userId,
    ip_address: ipAddress,
    device_id: deviceId,
    identity_key: identityKey,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return c.json<DownloadResponse>({ success: true, counted: false })
    }
    return databaseErrorResponse(c, insertError)
  }

  return finishCountedDownload(c, countedScript, identityKey)
})

/** Get flagged scripts (admin only) */
scripts.get('/flagged/all', authMiddleware, requireAdminAccess, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isOwner(profile?.role) && !(await hasAnyStudyRole(supabase, user.id))) {
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
