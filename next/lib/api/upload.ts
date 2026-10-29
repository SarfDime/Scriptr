import { UI_STRINGS } from '@shared/config/strings'
import type { StagedUpload } from '@shared/types/file-upload.types'
import { UserFacingError } from '@/lib/user-facing-error'
import { ApiError } from './next-api'

/** A plain `fetch`, not `apiFetch`: the target is R2 rather than our API, and
 * the presigned URL already carries the credentials, so the session cookie
 * must not be sent along. The content type and the body length are part of the
 * signature, so the file has to be sent exactly as it was declared. */
export const putToStaging = async (
  { url, contentType }: StagedUpload,
  file: File
): Promise<void> => {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!response.ok) {
    throw new UserFacingError(
      UI_STRINGS.scripts.uploadModal.fileErrors.stagingFailed
    )
  }
}

/**
 * An upload rejection whose body carries a message written for the user. A 401
 * or 403 is excluded: those need sign-in or a "not allowed" treatment rather
 * than the server's wording, so they are left to the caller.
 */
export const isUserFacingUploadRejection = (
  error: unknown
): error is ApiError =>
  error instanceof ApiError &&
  error.status !== 401 &&
  error.status !== 403 &&
  typeof error.data?.error === 'string'

/** The rejection as it should be shown, or `error` unchanged when it is one the
 * user should not read. */
export const toUserFacingUploadError = (error: unknown): unknown =>
  isUserFacingUploadRejection(error)
    ? new UserFacingError(error.message)
    : error
