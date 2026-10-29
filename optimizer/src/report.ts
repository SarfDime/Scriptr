import type { FileType } from '@shared/types/api.types'
import type { OptimizeFileResult } from '@shared/types/file-upload.types'
import { formatBytes, formatDuration } from './format'
import type { OptimizeAttempt, SizeLimits } from './types'

/** What the pipeline learned along the way, for the log line. */
export type OutcomeSummary = {
  /** Size of the uploaded file, before optimizing. */
  inputBytes?: number
  /** What was done, e.g. `webp q80 max 2400px` or `gs /ebook`. */
  operation?: string
  /** Every size an optimizer tried, in order. */
  attempts?: ReadonlyArray<OptimizeAttempt>
  /** Why an optimizer gave up, when it did. */
  detail?: string
}

type OutcomeInput = {
  declaredType: FileType
  /** `avatar` is labelled as such, so an avatar and a script image are told
   * apart in the logs. */
  purpose?: 'avatar'
  result: OptimizeFileResult
  summary: OutcomeSummary
  durationMs: number
  limits: SizeLimits
}

const describeAttempts = (
  attempts: ReadonlyArray<OptimizeAttempt> = []
): string =>
  attempts.length === 0
    ? ''
    : ` [${attempts
        .map(
          ({ step, bytes, ms }) =>
            `${step} ${formatBytes(bytes)} in ${formatDuration(ms)}`
        )
        .join(', ')}]`

const formatChange = (before: number, after: number): string => {
  if (before <= 0) return '0%'
  const change = Math.round((1 - after / before) * 100)
  return change >= 0 ? `-${change}%` : `+${-change}%`
}

/**
 * One log line for one file: what was done and what came of it.
 *
 * `pdf -> pdf: 16.00 MB -> 2.90 MB (-82%) via gs /screen in 41.0s [gs /ebook ...]`
 * `pdf rejected as too-large (best 4.20 MB, cap 3.50 MB) after 41.0s [...]`
 */
export const describeOutcome = ({
  declaredType,
  purpose,
  result,
  summary,
  durationMs,
  limits,
}: OutcomeInput): { level: 'success' | 'warn'; message: string } => {
  const label = purpose === 'avatar' ? `avatar ${declaredType}` : declaredType
  const attempts = describeAttempts(summary.attempts)
  const took = formatDuration(durationMs)

  if (result.ok) {
    const { fileKey, fileType, fileSizeBytes } = result.file
    const before = summary.inputBytes ?? fileSizeBytes
    return {
      level: 'success',
      message: `${label} -> ${fileType}: ${formatBytes(before)} -> ${formatBytes(fileSizeBytes)} (${formatChange(before, fileSizeBytes)}) via ${summary.operation ?? 'optimizer'} in ${took}${attempts} -> ${fileKey}`,
    }
  }

  const best =
    result.sizeBytes === undefined
      ? ''
      : ` (best ${formatBytes(result.sizeBytes)}, cap ${formatBytes(limits.cap)})`
  const detail = summary.detail ? `: ${summary.detail}` : ''
  return {
    level: 'warn',
    message: `${label} rejected as ${result.reason}${best}${detail} after ${took}${attempts}`,
  }
}
