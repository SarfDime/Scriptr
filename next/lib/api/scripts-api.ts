import { apiRoutes, withQuery } from '@shared/config/api-routes'
import { SCRIPT_CACHE_TAGS } from '@shared/config/cache-tags'
import { UPLOAD_FINALIZE_TIMEOUT_MS } from '@shared/config/next-constants'
import { MAX_STORED_FILE_BYTES } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
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
import {
  isRetryPointless,
  retrySizeCeiling,
} from '@shared/utils/optimizer-retry'
import {
  findOptimizerFailure,
  forgetOptimizerFailure,
  rememberOptimizerFailure,
} from '@/lib/optimizer-attempts'
import { UserFacingError } from '@/lib/user-facing-error'
import type { ScriptUploadInput } from '@/types/components/Scripts.types'
import {
  apiFetchPublicRead,
  apiFetchRequired,
  cachedPublicRead,
} from './next-api'
import {
  isUserFacingUploadRejection,
  putToStaging,
  toUserFacingUploadError,
} from './upload'

const SCRIPT_COMMENT_COUNT_CACHE_VERSION = 2

/** Scripts for one subject. Public and unscoped, so the response is shared. */
export const getScriptsBySubject = (subjectId: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    withQuery(apiRoutes.scripts.subjectBySubjectId(subjectId), {
      commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
    }),
    [],
    cachedPublicRead([
      SCRIPT_CACHE_TAGS.subject(subjectId),
      SCRIPT_CACHE_TAGS.list(),
    ])
  )

/** Platform-wide top scripts by vote score. Public and unscoped. */
export const getTopScripts = (limit = 10) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    `${apiRoutes.scripts.top(limit)}&commentCountVersion=${SCRIPT_COMMENT_COUNT_CACHE_VERSION}`,
    [],
    cachedPublicRead([SCRIPT_CACHE_TAGS.top()])
  )

/** Builds a personalized top list from individually cached public subject
 * feeds. The selection itself stays request-specific; the script reads do
 * not carry a cookie and therefore remain shared Data Cache entries. */
export const getTopScriptsForSubjects = async (
  subjectIds: Array<string>,
  limit = 10
) => {
  const uniqueSubjectIds = [...new Set(subjectIds)]
  const scripts = (
    await Promise.all(
      uniqueSubjectIds.map((subjectId) => getScriptsBySubject(subjectId))
    )
  ).flat()

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
 * dataset. Public and unscoped, so no cookie is sent. */
export const searchScripts = (query: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    apiRoutes.scripts.search(query),
    [],
    {
      cache: 'no-store',
    }
  )

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
  const [, { url }] = await Promise.all([
    apiFetchRequired<DownloadResponse>(
      apiRoutes.scripts.downloadById(scriptId),
      {
        method: 'POST',
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
  files: ReadonlyArray<File>
): unknown => {
  if (isUserFacingUploadRejection(error) && error.status === 413) {
    const { stagingKey, sizeBytes } = error.data ?? {}
    const fileIndex = uploads.findIndex(
      (upload) => upload.stagingKey === stagingKey
    )
    const name = files[fileIndex]?.name
    if (name && typeof sizeBytes === 'number') {
      return new UserFacingError(
        UI_STRINGS.scripts.uploadModal.fileErrors.tooLargeAfterOptimizingNamed(
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
        UI_STRINGS.scripts.uploadModal.fileErrors.retryTooLarge(
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
    throw toUploadError(error, [], files)
  })

  const staged = await Promise.all(
    uploads.map(async (upload, index) => {
      const file = files[index]
      if (!file) {
        throw new UserFacingError(
          UI_STRINGS.scripts.uploadModal.fileErrors.stagingFailed
        )
      }
      await putToStaging(upload, file)
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
    throw toUploadError(error, uploads, files)
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
  onStage?: (stage: UploadStage) => void
) => {
  const uploaded = await uploadScriptFiles(subjectId, files, onStage)

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
