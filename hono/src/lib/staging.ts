import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  FILE_CONTENT_TYPES,
  MAX_STORED_FILE_BYTES,
} from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { FileType } from '@shared/types/api.types'
import type {
  OptimizeFileFailureReason,
  OptimizeFileResult,
  StagedUpload,
} from '@shared/types/file-upload.types'
import { isFileType } from '@shared/utils/api.utils'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { HonoEnv } from '../types/env.types'
import { createS3Client } from './r2'

const { fileErrors } = UI_STRINGS.scripts.uploadModal

/** Where browsers upload to before the optimizer has seen a file. Objects here
 * are removed once processed; the bucket also expires this prefix. */
const STAGING_PREFIX = 'staging'
const STAGING_UPLOAD_TTL_SECONDS = 10 * 60
const STAGING_KEY_PATTERN = /^staging\/([^/]+)\/[0-9a-f-]{36}\.([a-z0-9]+)$/

/**
 * A presigned PUT into the staging prefix for one file, so its bytes go from
 * the browser straight to R2 and never through the API (Vercel caps request
 * bodies at 4.5 MB). The content type and length are part of the signature, so
 * R2 rejects a PUT that doesn't match what was declared (and validated) here.
 */
export const createStagedUpload = async (
  c: Context<HonoEnv>,
  userId: string,
  { fileType, size }: { fileType: FileType; size: number },
  r2: S3Client = createS3Client(c)
): Promise<StagedUpload> => {
  const stagingKey = `${STAGING_PREFIX}/${userId}/${crypto.randomUUID()}.${fileType}`
  const contentType = FILE_CONTENT_TYPES[fileType]
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: c.env.R2_BUCKET,
      Key: stagingKey,
      ContentType: contentType,
      ContentLength: size,
    }),
    {
      expiresIn: STAGING_UPLOAD_TTL_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    }
  )
  return { stagingKey, url, contentType }
}

/**
 * The file type of a staging key minted by `createStagedUpload` for this user,
 * or `null` for anything else. Keys are never trusted from the client: the user
 * id inside the key has to match the caller's, so nobody can finalize (or
 * read) another user's staged upload.
 */
export const parseStagingKey = (
  key: string,
  userId: string
): FileType | null => {
  const match = STAGING_KEY_PATTERN.exec(key)
  if (!match || match[1] !== userId) return null
  const extension = match[2] ?? ''
  return isFileType(extension) ? extension : null
}

const FAILURE_STATUS: Record<OptimizeFileFailureReason, ContentfulStatusCode> =
  {
    'invalid-content': 400,
    missing: 400,
    'too-large': 413,
    failed: 500,
    unavailable: 503,
  }

const FAILURE_MESSAGES: Record<
  OptimizeFileFailureReason,
  (capBytes: number, sizeBytes?: number) => string
> = {
  'invalid-content': () => fileErrors.invalidContent,
  missing: () => fileErrors.unknownUpload,
  'too-large': (capBytes, sizeBytes) =>
    fileErrors.tooLargeAfterOptimizing(capBytes, sizeBytes),
  failed: () => fileErrors.processingFailed,
  unavailable: () => fileErrors.processingUnavailable,
}

/**
 * The HTTP status and user-facing message for a file the optimizer rejected.
 * `capBytes` is the limit that applied (the scripts' by default), so a
 * `too-large` message names the right one.
 */
export const failureResponse = (
  { reason, sizeBytes }: Extract<OptimizeFileResult, { ok: false }>,
  capBytes: number = MAX_STORED_FILE_BYTES
): { status: ContentfulStatusCode; message: string } => ({
  status: FAILURE_STATUS[reason],
  message: FAILURE_MESSAGES[reason](capBytes, sizeBytes),
})
