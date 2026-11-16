import { apiRoutes, withQuery } from '@shared/config/api-routes'
import { SCRIPT_CACHE_TAGS } from '@shared/config/cache-tags'
import type { LocaleId } from '@shared/config/localization-constants'
import { UPLOAD_FINALIZE_TIMEOUT_MS } from '@shared/config/next-constants'
import { MAX_STORED_FILE_BYTES } from '@shared/config/shared-constants'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ScriptFileInput } from '@shared/types/api.types'
import type {
  FinalizeUploadRequest,
  StagedUpload,
  UploadUrlsRequest,
  UploadUrlsResponse,
} from '@shared/types/file-upload.types'
import type {
  CreateScriptResponse,
  DownloadResponse,
  MyScriptSummary,
  ScriptAttachFilesResponse,
  ScriptDeleteResponse,
  ScriptFile,
  ScriptPatchResponse,
  ScriptSummary,
  ScriptUpdateInput,
  UploadResponse,
} from '@shared/types/scripts.types'
import { getStrings } from '@shared/utils/localized-strings'
import {
  isRetryPointless,
  retrySizeCeiling,
} from '@shared/utils/optimizer-retry'
import { getDeviceId } from '@/lib/device-id'
import { nextLogs } from '@/lib/logger'
import {
  findOptimizerFailure,
  forgetOptimizerFailure,
  rememberOptimizerFailure,
} from '@/lib/optimizer-attempts'
import { UserFacingError } from '@/lib/user-facing-error'
import type { ScriptUploadInput } from '@/types/components/Scripts.types'
import { apiFetch, apiFetchRequired, cachedPublicRead } from './next-api'
import {
  isUserFacingUploadRejection,
  putToStaging,
  toUserFacingUploadError,
} from './upload'

/**
 * Versions the cached script payloads. It rides along as a query parameter, so
 * bumping it changes the fetch URL and every cached body is bypassed instead of
 * being read in a shape the app no longer expects.
 *
 * Bump it whenever a cached select changes shape: a new field on
 * `SCRIPT_SUMMARY_SELECT`, a retyped one (`title`/`description` are `{ en, mk }`
 * maps), or a cached key that the current mutation tags cannot expire. A cached
 * entry only expires by tag, and a deploy does not touch it.
 */
const SCRIPT_COMMENT_COUNT_CACHE_VERSION = 5

/** Scripts for one subject. Public and unscoped, so the response is shared.
 *
 * Returns `null` when the read fails. An empty list is a real answer here, so
 * a fallback to `[]` would present an unreachable API as "no scripts in this
 * subject" and hide the outage. */
export const getScriptsBySubject = async (subjectId: string) => {
  try {
    return await apiFetch<Array<ScriptSummary>>(
      withQuery(apiRoutes.scripts.subjectBySubjectId(subjectId), {
        commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
      }),
      cachedPublicRead([
        SCRIPT_CACHE_TAGS.subject(subjectId),
        SCRIPT_CACHE_TAGS.list(),
      ])
    )
  } catch (error) {
    nextLogs({
      message: `Scripts for subject ${subjectId} could not be read.`,
      logLevel: 'warn',
      error,
    })
    return null
  }
}

/** A study's scripts, for its site's home. Public and unscoped, so the response
 * is shared; `null` means the read failed, for the same reason as
 * `getScriptsBySubject`. Tagged by study rather than by `list`, so a script
 * published in another study leaves this page cached. */
export const getScriptsByStudy = async (studyId: string) => {
  try {
    return await apiFetch<Array<ScriptSummary>>(
      withQuery(apiRoutes.scripts.studyByStudyId(studyId), {
        commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
      }),
      cachedPublicRead([SCRIPT_CACHE_TAGS.study(studyId)])
    )
  } catch (error) {
    nextLogs({
      message: `Scripts for study ${studyId} could not be read.`,
      logLevel: 'warn',
      error,
    })
    return null
  }
}

/**
 * The top scripts by vote score — the one study's when `studyId` is given (a
 * study's site asks for its own), the whole platform otherwise. `null` means the
 * read failed, for the same reason as `getScriptsBySubject`.
 */
export const getTopScripts = async (limit = 10, studyId?: string | null) => {
  try {
    return await apiFetch<Array<ScriptSummary>>(
      `${apiRoutes.scripts.top(limit)}&commentCountVersion=${
        SCRIPT_COMMENT_COUNT_CACHE_VERSION
      }${studyId ? `&study=${encodeURIComponent(studyId)}` : ''}`,
      cachedPublicRead(
        // One study's top list is invalidated by that study's mutations; the
        // platform-wide one by any of them.
        studyId ? [SCRIPT_CACHE_TAGS.study(studyId)] : [SCRIPT_CACHE_TAGS.top()]
      )
    )
  } catch (error) {
    nextLogs({
      message: studyId
        ? `Top scripts for study ${studyId} could not be read.`
        : 'Top scripts could not be read.',
      logLevel: 'warn',
      error,
    })
    return null
  }
}

/**
 * A personalized top list built from the individually cached public feeds of the
 * given subjects — a study's site uses it for the reader's unfinished subjects.
 * The selection is request-specific; the per-subject reads carry no cookie and
 * stay shared cache entries.
 */
export const getTopScriptsForSubjects = async (
  subjectIds: Array<string>,
  limit = 10
) => {
  const uniqueSubjectIds = [...new Set(subjectIds)]
  const results = await Promise.all(
    uniqueSubjectIds.map((subjectId) => getScriptsBySubject(subjectId))
  )
  const scripts = results.flatMap((subjectScripts) => subjectScripts ?? [])

  // A partial feed is still worth showing; only an all-failed read is an outage.
  if (scripts.length === 0 && results.some((result) => result === null)) {
    return null
  }

  return scripts
    .sort(
      (left, right) =>
        right.vote_score - left.vote_score ||
        right.download_count - left.download_count ||
        right.updated_at.localeCompare(left.updated_at)
    )
    .slice(0, limit)
}

/** Returns the script directly — GET /:id is NOT wrapped in `{ script }`
 * (that wrapper only exists on the POST /scripts create response). Public and
 * unscoped, so the response is cached per script id and shared by everyone. */
export const getScript = (scriptId: string) =>
  apiFetchRequired<ScriptSummary>(
    withQuery(apiRoutes.scripts.byId(scriptId), {
      commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
    }),
    cachedPublicRead([SCRIPT_CACHE_TAGS.detail(scriptId)])
  )

/** Never cached regardless — search results must always reflect the live
 * dataset. Public and unscoped, so no cookie is sent.
 *
 * `studyId` scopes the read to one study, which is what its site's header
 * search asks for; without it the whole platform is searched.
 *
 * Returns `null` when the API is unreachable or rejects the request, instead
 * of falling back to an empty list: on a search page an empty list is a real
 * answer ("nothing matched"), so substituting one for a failure told the
 * reader their query had no results when the search never ran. The
 * fallback-to-empty variants are for reads that a build must survive; search
 * renders per request. */
export const searchScripts = async (query: string, studyId?: string | null) => {
  try {
    return await apiFetch<Array<ScriptSummary>>(
      apiRoutes.scripts.search(query, studyId ?? undefined),
      { cache: 'no-store' }
    )
  } catch (error) {
    nextLogs({
      message: `Search request failed for query "${query}".`,
      logLevel: 'warn',
      error,
    })
    return null
  }
}

/** Never cached: results are scoped to the requesting user's session, and
 * the endpoint requires auth unconditionally (authMiddleware) — so `cookie`
 * stays required here, not optional like the others above. Wrapped in
 * `{ scripts: [...] }`, and a different (shallower) shape than every other
 * function here — see `MyScriptSummary`'s doc comment. */
export const getMyScripts = (cookie: string) =>
  apiFetchRequired<{ scripts: Array<MyScriptSummary> }>(
    apiRoutes.scripts.myScripts,
    {
      headers: { cookie },
      cache: 'no-store',
    }
  )

/** Author or admin only. Restriction-checked (RLS), so a restricted author
 * gets a `403`; run it through `useProtectedAction`. */
export const updateScript = (scriptId: string, input: ScriptUpdateInput) =>
  apiFetchRequired<ScriptPatchResponse>(apiRoutes.scripts.byId(scriptId), {
    method: 'PATCH',
    body: input,
  })

/** Author or admin only. Never restriction-checked, so not wrapped. */
export const deleteScript = (scriptId: string) =>
  apiFetchRequired<ScriptDeleteResponse>(apiRoutes.scripts.byId(scriptId), {
    method: 'DELETE',
  })

/** Author or admin only. Never restriction-checked, so not wrapped. */
export const removeScriptFile = (scriptId: string, fileId: string) =>
  apiFetchRequired<ScriptDeleteResponse>(
    apiRoutes.scripts.filesByScriptIdAndFileId(scriptId, fileId),
    { method: 'DELETE' }
  )

export const downloadScript = async (scriptId: string, file: ScriptFile) => {
  const deviceId = getDeviceId()
  const [, { url }] = await Promise.all([
    apiFetchRequired<DownloadResponse>(
      apiRoutes.scripts.downloadById(scriptId),
      {
        method: 'POST',
        // The API dedupes a download by account, then address, then this.
        ...(deviceId ? { headers: { 'x-device-id': deviceId } } : {}),
      }
    ),
    getScriptFileUrl(file.file_url, { download: true }),
  ])
  return url
}

/** `download: true` asks for a save-to-disk URL named after the stored file
 * name; without it the URL renders inline, which is what previews want. */
export const getScriptFileUrl = (
  fileKey: string,
  options?: { download?: boolean }
) =>
  apiFetchRequired<{ url: string; key: string }>(
    withQuery(apiRoutes.fileOps.getFileByKey(fileKey), {
      download: options?.download ? 1 : undefined,
    }),
    { cache: 'no-store' }
  )

export type UploadStage = 'uploading' | 'optimizing'

/**
 * A file that is still too large after optimizing is named, since the API only
 * knows it by its staging key. Everything else follows the shared mapping.
 */
const toUploadError = (
  error: unknown,
  uploads: ReadonlyArray<StagedUpload>,
  files: ReadonlyArray<File>,
  locale: LocaleId
): unknown => {
  if (isUserFacingUploadRejection(error) && error.status === 413) {
    const { stagingKey, sizeBytes } = error.data ?? {}
    const fileIndex = uploads.findIndex(
      (upload) => upload.stagingKey === stagingKey
    )
    const name = files[fileIndex]?.name
    if (name && typeof sizeBytes === 'number') {
      return new UserFacingError(
        getStrings(
          UI_STRINGS_PACK,
          locale
        ).scripts.uploadModal.fileErrors.tooLargeAfterOptimizingNamed(
          name,
          MAX_STORED_FILE_BYTES,
          sizeBytes
        )
      )
    }
  }
  return toUserFacingUploadError(error)
}

/** Uploads script files in three steps: get presigned URLs, PUT each file
 * straight to R2 (so large files never pass through the API), then have the
 * API finalize them. Returns the stored files to pass to `createScript`.
 * `onStage` fires as each phase starts, since finalizing can take a while. */
export const uploadScriptFiles = async (
  subjectId: string,
  files: ReadonlyArray<File>,
  locale: LocaleId,
  onStage?: (stage: UploadStage) => void
): Promise<Array<ScriptFileInput>> => {
  // Refuse a retry the optimizer cannot rescue before spending a presigned URL,
  // an R2 upload and a Cloud Run invocation on it. The API repeats this check.
  for (const file of files) {
    const previous = findOptimizerFailure(file.name)
    if (
      previous &&
      isRetryPointless(previous, file.size, MAX_STORED_FILE_BYTES)
    ) {
      throw new UserFacingError(
        getStrings(
          UI_STRINGS_PACK,
          locale
        ).scripts.uploadModal.fileErrors.retryTooLarge(
          file.name,
          retrySizeCeiling(previous, MAX_STORED_FILE_BYTES)
        )
      )
    }
  }

  onStage?.('uploading')
  const urlsRequest: UploadUrlsRequest = {
    subjectId,
    files: files.map(({ name, size }) => ({ name, size })),
  }
  const { uploads } = await apiFetchRequired<UploadUrlsResponse>(
    apiRoutes.fileOps.uploadUrls,
    { method: 'POST', body: urlsRequest }
  ).catch((error: unknown) => {
    throw toUploadError(error, [], files, locale)
  })

  const staged = await Promise.all(
    uploads.map(async (upload, index) => {
      const file = files[index]
      if (!file) {
        throw new UserFacingError(
          getStrings(UI_STRINGS_PACK, locale).scripts.uploadModal.fileErrors
            .stagingFailed
        )
      }
      await putToStaging(upload, file, locale)
      const priorRejection = findOptimizerFailure(file.name)
      return {
        stagingKey: upload.stagingKey,
        name: file.name,
        ...(priorRejection ? { priorRejection } : {}),
      }
    })
  )

  onStage?.('optimizing')
  const finalizeRequest: FinalizeUploadRequest = { subjectId, files: staged }
  const { files: stored } = await apiFetchRequired<UploadResponse>(
    apiRoutes.fileOps.finalize,
    {
      method: 'POST',
      body: finalizeRequest,
      timeoutMs: UPLOAD_FINALIZE_TIMEOUT_MS,
    }
  ).catch((error: unknown) => {
    rememberRejections(error, uploads, files)
    throw toUploadError(error, uploads, files, locale)
  })

  for (const file of files) forgetOptimizerFailure(file.name)
  return stored
}

/** Remembers how small the optimizer got each file it rejected, so a retry at
 * the same size can be turned away here instead of on the optimizer. */
const rememberRejections = (
  error: unknown,
  uploads: ReadonlyArray<StagedUpload>,
  files: ReadonlyArray<File>
) => {
  if (!isUserFacingUploadRejection(error) || error.status !== 413) return
  const { stagingKey, sizeBytes } = error.data ?? {}
  if (typeof sizeBytes !== 'number') return
  const index = uploads.findIndex((upload) => upload.stagingKey === stagingKey)
  const file = files[index]
  if (!file) return
  rememberOptimizerFailure(file.name, {
    attemptedBytes: file.size,
    resultBytes: sizeBytes,
  })
}

/** Adds files to an existing script: uploads them to R2, then attaches them.
 * If the attach fails, the API removes the uploaded objects again. Author or
 * admin only, and restriction-checked, so run it through
 * `useProtectedAction`. */
export const addScriptFiles = async (
  scriptId: string,
  subjectId: string,
  files: ReadonlyArray<File>,
  locale: LocaleId,
  onStage?: (stage: UploadStage) => void
) => {
  const uploaded = await uploadScriptFiles(subjectId, files, locale, onStage)

  return apiFetchRequired<ScriptAttachFilesResponse>(
    apiRoutes.scripts.filesById(scriptId),
    { method: 'POST', body: { files: uploaded } }
  )
}

export const createScript = async (
  input: ScriptUploadInput,
  files: Array<ScriptFileInput>
) => {
  const { script } = await apiFetchRequired<CreateScriptResponse>(
    apiRoutes.scripts.index,
    {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description ?? null,
        subjectId: input.subjectId,
        professorId: input.professorId,
        examSession: input.examSession ?? null,
        examYear: input.examYear ?? null,
        additionalReading: input.additionalReading ?? [],
        files,
      },
    }
  )

  return script
}
