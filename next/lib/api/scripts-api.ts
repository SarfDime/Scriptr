import { apiRoutes, withQuery } from '@shared/config/api-routes'
import { SCRIPT_CACHE_TAGS } from '@shared/config/cache-tags'
import type { ScriptFileInput } from '@shared/types/api.types'
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
import type { ScriptUploadInput } from '@/types/components/Scripts.types'
import {
  apiFetchPublicRead,
  apiFetchRequired,
  cachedUnlessPersonalized,
} from './next-api'

const SCRIPT_COMMENT_COUNT_CACHE_VERSION = 2

/** Shared/cached by default. Pass `cookie` to reflect the caller's
 * faculty-scoped result — scripts.ts's list endpoints filter by the
 * session's selected faculties when a user is present, via
 * getSelectedFacultyScope(). Forwarding a cookie forces `no-store` (see
 * cachedUnlessPersonalized) so one user's scoped result is never served
 * from another user's cache entry. */
export const getScripts = (cookie?: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    withQuery(apiRoutes.scripts.index, {
      commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
    }),
    [],
    cachedUnlessPersonalized(cookie, [SCRIPT_CACHE_TAGS.list()])
  )

export const getScriptsBySubject = (subjectId: string, cookie?: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    withQuery(apiRoutes.scripts.subjectBySubjectId(subjectId), {
      commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
    }),
    [],
    cachedUnlessPersonalized(cookie, [
      SCRIPT_CACHE_TAGS.subject(subjectId),
      SCRIPT_CACHE_TAGS.list(),
    ])
  )

export const getTopScripts = (limit = 10, cookie?: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    `${apiRoutes.scripts.top(limit)}&commentCountVersion=${SCRIPT_COMMENT_COUNT_CACHE_VERSION}`,
    [],
    cachedUnlessPersonalized(cookie, [SCRIPT_CACHE_TAGS.top()])
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

export const getPopularScripts = (limit = 10, cookie?: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    `${apiRoutes.scripts.popular(limit)}&commentCountVersion=${SCRIPT_COMMENT_COUNT_CACHE_VERSION}`,
    [],
    cachedUnlessPersonalized(cookie, [SCRIPT_CACHE_TAGS.popular()])
  )

/** Returns the script directly — GET /:id is NOT wrapped in `{ script }`
 * (that wrapper only exists on the POST /scripts create response). Pass
 * `cookie` so a faculty-scoped 404 (the requesting user's selected
 * faculties don't include this script's) resolves correctly instead of
 * serving a cached result computed for a different user or no user. */
export const getScript = (scriptId: string, cookie?: string) =>
  apiFetchRequired<ScriptSummary>(
    withQuery(apiRoutes.scripts.byId(scriptId), {
      commentCountVersion: SCRIPT_COMMENT_COUNT_CACHE_VERSION,
    }),
    cachedUnlessPersonalized(cookie, [SCRIPT_CACHE_TAGS.detail(scriptId)])
  )

/** Never cached regardless — search results must always reflect the live
 * dataset. `cookie` is still worth forwarding here for faculty-scoping
 * consistency with the other list endpoints; there's no cache trade-off
 * either way since this is already `no-store`. */
export const searchScripts = (query: string, cookie?: string) =>
  apiFetchPublicRead<Array<ScriptSummary>>(
    apiRoutes.scripts.search(query),
    [],
    {
      ...(cookie && { headers: { cookie } }),
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

export const uploadFiles = async (body: FormData) => {
  const { files } = await apiFetchRequired<UploadResponse>(
    apiRoutes.fileOps.upload,
    {
      method: 'POST',
      body,
    }
  )

  return files
}

/** Adds files to an existing script: uploads them to R2, then attaches them.
 * If the attach fails, the API removes the uploaded objects again. Author or
 * admin only, and restriction-checked, so run it through
 * `useProtectedAction`. */
export const addScriptFiles = async (
  scriptId: string,
  subjectId: string,
  files: Array<File>
) => {
  const formData = new FormData()
  formData.append('subjectId', subjectId)
  for (const file of files) {
    formData.append('files', file)
  }
  const uploaded = await uploadFiles(formData)

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
        additionalReading: input.additionalReading ?? [],
        files,
      },
    }
  )

  return script
}
