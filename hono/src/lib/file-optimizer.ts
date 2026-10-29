import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import {
  FILE_CONTENT_TYPES,
  IMMUTABLE_FILE_CACHE_CONTROL,
  MAX_STORED_FILE_BYTES,
} from '@shared/config/shared-constants'
import type {
  OptimizeFileRequest,
  OptimizeFileResult,
} from '@shared/types/file-upload.types'
import { matchesFileSignature } from '@shared/utils/file-signature'
import { isMissingObjectError } from '@shared/utils/r2.utils'
import { honoLog } from './logger'
import { optimizeViaService } from './optimizer-client'
import { createS3Client } from './r2'

/**
 * In-process stand-in for the optimizer service. It does not shrink or convert
 * anything: it checks the staged object is within the stored-size cap and
 * really is the declared type, then stores it as uploaded. Used when no
 * service is configured; see `optimizeStagedFile`.
 *
 * Moves the object from staging to its final key and removes the staged copy.
 * Expected rejections come back as `{ ok: false }`; anything unexpected (R2
 * unavailable, ...) throws.
 */
async function storeStagedFileAsUploaded(
  c: Parameters<typeof createS3Client>[0],
  request: OptimizeFileRequest
): Promise<OptimizeFileResult> {
  const {
    stagingBucket,
    stagingKey,
    destinationBucket,
    destinationKeyBase,
    declaredType,
  } = request
  const r2 = createS3Client(c)

  // Size first (HEAD), so an oversized object is never downloaded.
  let stagedSize: number
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: stagingBucket, Key: stagingKey })
    )
    stagedSize = head.ContentLength ?? 0
  } catch (error) {
    if (isMissingObjectError(error)) return { ok: false, reason: 'missing' }
    throw error
  }
  if (stagedSize > MAX_STORED_FILE_BYTES) {
    return { ok: false, reason: 'too-large', sizeBytes: stagedSize }
  }

  const object = await r2.send(
    new GetObjectCommand({ Bucket: stagingBucket, Key: stagingKey })
  )
  const bytes = await object.Body?.transformToByteArray()
  if (
    !bytes ||
    bytes.byteLength === 0 ||
    !matchesFileSignature(declaredType, bytes)
  ) {
    return { ok: false, reason: 'invalid-content' }
  }

  const fileKey = `${destinationKeyBase}.${declaredType}`
  await r2.send(
    new PutObjectCommand({
      Bucket: destinationBucket,
      Key: fileKey,
      Body: bytes,
      ContentType: FILE_CONTENT_TYPES[declaredType],
      CacheControl: IMMUTABLE_FILE_CACHE_CONTROL,
    })
  )

  // Best effort: the staging prefix also expires through a bucket lifecycle rule.
  await r2
    .send(new DeleteObjectCommand({ Bucket: stagingBucket, Key: stagingKey }))
    .catch((error: unknown) =>
      honoLog({
        logLevel: 'warn',
        message: 'Failed to delete staged upload',
        error,
      })
    )

  return {
    ok: true,
    file: {
      fileKey,
      fileType: declaredType,
      fileSizeBytes: bytes.byteLength,
      bucket: destinationBucket,
    },
  }
}

/**
 * Optimizes one staged file: through the optimizer service when `OPTIMIZER_URL`
 * and `OPTIMIZER_SECRET` are both set, otherwise with the in-process stand-in
 * above. Callers see the same `OptimizeFileRequest` / `OptimizeFileResult`
 * contract either way.
 *
 * Fails closed: a configured service that is unreachable, or a half-configured
 * one, rejects the upload instead of storing the file unoptimized.
 */
export async function optimizeStagedFile(
  c: Parameters<typeof createS3Client>[0],
  request: OptimizeFileRequest
): Promise<OptimizeFileResult> {
  const { OPTIMIZER_URL: url, OPTIMIZER_SECRET: secret } = c.env
  if (!(url || secret)) {
    // An avatar has to be cropped and resized, which the stand-in can't do, so
    // rather than store a raw photo as someone's avatar it needs the service.
    if (request.purpose === 'avatar') {
      honoLog({
        logLevel: 'warn',
        message: 'Avatar uploads need the optimizer service',
        error: new Error('OPTIMIZER_URL and OPTIMIZER_SECRET are not set'),
      })
      return { ok: false, reason: 'unavailable' }
    }
    return storeStagedFileAsUploaded(c, request)
  }

  if (!(url && secret)) {
    honoLog({
      logLevel: 'error',
      message: 'File optimizer is misconfigured',
      error: new Error(
        'OPTIMIZER_URL and OPTIMIZER_SECRET must be set together'
      ),
    })
    return { ok: false, reason: 'unavailable' }
  }

  return optimizeViaService({ url, secret }, request)
}
