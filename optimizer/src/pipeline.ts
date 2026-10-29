import {
  AVATAR_FILE_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from '@shared/config/avatar'
import {
  FILE_CONTENT_TYPES,
  IMMUTABLE_FILE_CACHE_CONTROL,
} from '@shared/config/shared-constants'
import type { FileType } from '@shared/types/api.types'
import type {
  OptimizeFileFailureReason,
  OptimizeFileRequest,
  OptimizeFileResult,
} from '@shared/types/file-upload.types'
import { getMaxUploadBytes } from '@shared/utils/api.utils'
import { matchesFileSignature } from '@shared/utils/file-signature'
import { AVATAR_LIMITS, optimizeAvatar } from './avatar'
import { optimizerLog } from './logger'
import { describeOutcome, type OutcomeSummary } from './report'
import type { ObjectStorage } from './storage'
import type { FileOptimizer, SizeLimits } from './types'
import { DEFAULT_LIMITS } from './types'

type PipelineDeps = {
  storage: ObjectStorage
  optimizers: Record<FileType, FileOptimizer>
  limits?: SizeLimits
  /** Used for requests with `purpose: 'avatar'`, whatever the file type. */
  avatarOptimizer?: FileOptimizer
}

const reject = (
  reason: OptimizeFileFailureReason,
  sizeBytes?: number
): OptimizeFileResult =>
  sizeBytes === undefined
    ? { ok: false, reason }
    : { ok: false, reason, sizeBytes }

/**
 * Optimizes one staged file and stores the result under its final key, then
 * logs what was done and what came of it.
 *
 * File-level outcomes (it's missing, too big, not what it claims to be, can't
 * be brought under the cap) come back as `{ ok: false }`. Storage problems
 * (R2 unreachable, ...) throw, which the HTTP layer reports as an error status
 * so the API treats the service as unavailable.
 *
 * An avatar request is held to the avatar limits and accepts only image types;
 * otherwise it goes through the same steps as any file.
 *
 * `deadline` (epoch ms) stops work from starting, and the final write from
 * happening, once the caller has given up waiting, so a request the API
 * already abandoned doesn't leave an orphaned object behind.
 */
export const createOptimizeFile = ({
  storage,
  optimizers,
  limits = DEFAULT_LIMITS,
  avatarOptimizer = optimizeAvatar,
}: PipelineDeps) => {
  const process = async (
    request: OptimizeFileRequest,
    deadline: number,
    summary: OutcomeSummary,
    activeLimits: SizeLimits
  ): Promise<OptimizeFileResult> => {
    const {
      stagingBucket,
      stagingKey,
      destinationBucket,
      destinationKeyBase,
      declaredType,
      purpose,
    } = request
    const isAvatar = purpose === 'avatar'

    if (isAvatar && !AVATAR_FILE_TYPES.includes(declaredType)) {
      return reject('invalid-content')
    }

    // Size first, so an oversized object is never downloaded.
    const stagedSize = await storage.size(stagingBucket, stagingKey)
    if (stagedSize === null) return reject('missing')
    summary.inputBytes = stagedSize
    // This is the upload being too big, not the optimized result, so no size is
    // reported (the user is told about sizes after optimizing).
    const maxUploadBytes = isAvatar
      ? AVATAR_MAX_UPLOAD_BYTES
      : getMaxUploadBytes(declaredType)
    if (stagedSize > maxUploadBytes) return reject('too-large')

    const staged = await storage.read(stagingBucket, stagingKey)
    if (staged === null) return reject('missing')
    if (
      staged.byteLength === 0 ||
      !matchesFileSignature(declaredType, staged)
    ) {
      return reject('invalid-content')
    }
    if (Date.now() > deadline) {
      summary.detail = 'deadline passed before optimizing'
      return reject('failed')
    }

    const optimize = isAvatar ? avatarOptimizer : optimizers[declaredType]
    const outcome = await optimize(staged, declaredType, {
      deadline,
      limits: activeLimits,
    })
    summary.attempts = outcome.attempts
    if (!outcome.ok) {
      summary.detail = outcome.detail
      return reject(outcome.reason, outcome.sizeBytes)
    }
    summary.operation = outcome.operation

    // Whatever an optimizer returns, the hard cap is enforced here.
    if (outcome.bytes.byteLength > activeLimits.cap) {
      return reject('too-large', outcome.bytes.byteLength)
    }
    if (Date.now() > deadline) {
      summary.detail = 'deadline passed before writing the result'
      return reject('failed')
    }

    const fileKey = `${destinationKeyBase}.${outcome.fileType}`
    await storage.write(destinationBucket, fileKey, outcome.bytes, {
      contentType: FILE_CONTENT_TYPES[outcome.fileType],
      cacheControl: IMMUTABLE_FILE_CACHE_CONTROL,
    })

    // Best effort: the staging prefix also expires through a lifecycle rule.
    await storage.remove(stagingBucket, stagingKey).catch((error: unknown) =>
      optimizerLog({
        logLevel: 'warn',
        message: 'Failed to delete staged upload',
        error,
      })
    )

    return {
      ok: true,
      file: {
        fileKey,
        fileType: outcome.fileType,
        fileSizeBytes: outcome.bytes.byteLength,
        bucket: destinationBucket,
      },
    }
  }

  return async (
    request: OptimizeFileRequest,
    deadline: number
  ): Promise<OptimizeFileResult> => {
    const startedAt = Date.now()
    const summary: OutcomeSummary = {}
    const activeLimits = request.purpose === 'avatar' ? AVATAR_LIMITS : limits

    const result = await process(request, deadline, summary, activeLimits)

    const { level, message } = describeOutcome({
      declaredType: request.declaredType,
      purpose: request.purpose,
      result,
      summary,
      durationMs: Date.now() - startedAt,
      limits: activeLimits,
    })
    optimizerLog({ logLevel: level, message })
    return result
  }
}
