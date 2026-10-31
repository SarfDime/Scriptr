import {
  MAX_STORED_FILE_BYTES,
  TARGET_STORED_FILE_BYTES,
} from '@shared/config/shared-constants'
import type { FileType } from '@shared/types/api.types'

/** `target` is what an optimizer aims for; `cap` is the most it may return. */
export type SizeLimits = {
  target: number
  cap: number
}

export const DEFAULT_LIMITS: SizeLimits = {
  target: TARGET_STORED_FILE_BYTES,
  cap: MAX_STORED_FILE_BYTES,
}

/** One size an optimizer tried: which step, how big it came out, how long it took. */
export type OptimizeAttempt = {
  step: string
  bytes: number
  ms: number
}

/**
 * The extra fields exist for the logs: what was done, every size tried, and why
 * an optimizer gave up. `sizeBytes` on a `too-large` rejection is the smallest
 * size it reached, which the user is told.
 */
export type OptimizeOutcome =
  | {
      ok: true
      bytes: Uint8Array
      fileType: FileType
      operation?: string
      attempts?: ReadonlyArray<OptimizeAttempt>
    }
  | {
      ok: false
      reason: 'invalid-content' | 'too-large' | 'failed'
      sizeBytes?: number
      detail?: string
      /** What the file is made of, when that explains the outcome. Only ever
       * logged: the API is told the reason and the size, nothing more. */
      diagnostics?: string
      attempts?: ReadonlyArray<OptimizeAttempt>
    }

export type OptimizeContext = {
  /** Epoch ms after which no more work should be started. */
  deadline: number
  limits: SizeLimits
}

/**
 * Turns an uploaded file into the bytes to store. `fileType` on success is the
 * type of what's returned, which can differ from the uploaded one (images
 * become `webp`).
 */
export type FileOptimizer = (
  input: Uint8Array,
  declaredType: FileType,
  context: OptimizeContext
) => Promise<OptimizeOutcome>

/** The smallest candidate. Callers always pass at least one. */
export const smallest = <T extends { bytes: Uint8Array }>(
  candidates: ReadonlyArray<T>
): T =>
  candidates.reduce((best, candidate) =>
    candidate.bytes.byteLength < best.bytes.byteLength ? candidate : best
  )
