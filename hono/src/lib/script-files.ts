import { MAX_STORED_FILE_BYTES } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { ScriptFileInput } from '@shared/types/api.types'
import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'
import { createS3Client, deleteR2Files, getR2FileSizes } from './r2'
import { isFileInScope, resolveStorageScope } from './storage-scope'

const { fileErrors } = UI_STRINGS.scripts.uploadModal

type VerifiedFiles =
  | { ok: true; files: Array<ScriptFileInput> }
  | { ok: false; status: 400 | 413 | 500; error: string }

/**
 * `POST /scripts` gets its files from the client, so nothing about them is
 * taken on trust. Each file has to lie inside the caller's own storage scope
 * for the subject, has to exist in R2, and is stored with the size R2 reports
 * rather than the one the client claims.
 *
 * Runs before anything is written or cleaned up, so a crafted key can neither
 * be attached to a script nor deleted by the route's failure paths.
 */
export const verifyReportedFiles = async (
  c: Context<HonoEnv>,
  userId: string,
  subjectId: string,
  reported: ReadonlyArray<ScriptFileInput>
): Promise<VerifiedFiles> => {
  if (reported.length === 0) return { ok: true, files: [] }

  const scope = await resolveStorageScope(c, userId, subjectId)
  if (!reported.every((file) => isFileInScope(file, scope))) {
    return { ok: false, status: 400, error: fileErrors.invalidRequest }
  }

  let sizes: Array<number | null>
  try {
    sizes = await getR2FileSizes(createS3Client(c), reported)
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to verify uploaded files',
      error,
    })
    return { ok: false, status: 500, error: fileErrors.processingFailed }
  }

  if (sizes.includes(null)) {
    return { ok: false, status: 400, error: fileErrors.unknownUpload }
  }

  if (sizes.some((size) => (size ?? 0) > MAX_STORED_FILE_BYTES)) {
    // In scope, so ours to remove. A failed cleanup mustn't mask the real error.
    await deleteR2Files(c, reported).catch(() => undefined)
    return {
      ok: false,
      status: 413,
      error: fileErrors.tooLargeAfterOptimizing(MAX_STORED_FILE_BYTES),
    }
  }

  return {
    ok: true,
    files: reported.map((file, index) => ({
      ...file,
      fileSizeBytes: sizes[index] ?? file.fileSizeBytes,
    })),
  }
}
