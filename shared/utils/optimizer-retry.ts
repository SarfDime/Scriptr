/**
 * Decides whether optimizing a file again is worth an optimizer run.
 *
 * A file that was already rejected as too large will be rejected again unless
 * it is meaningfully smaller, and every attempt costs a Cloud Run invocation and
 * a Ghostscript run. Rather than guess a fixed percentage, extrapolate from what
 * the previous attempt actually achieved: if 15 MB came out at 4.5 MB, then only
 * a file small enough that the same ratio lands under the cap can pass.
 */
export type OptimizerFailure = {
  /** Size of the file that was rejected. */
  attemptedBytes: number
  /** Smallest size the optimizer managed to reach for it. */
  resultBytes: number
}

/**
 * How much headroom to leave under the cap. A retry that would only *just*
 * squeeze under it is not worth the run, since the extrapolation is an estimate
 * and the next file will not compress identically.
 */
export const OPTIMIZER_RETRY_MARGIN = 0.9

/**
 * The largest file that could still fit under `cap`, given what the optimizer
 * achieved on an earlier attempt at the same document. Returns 0 when nothing
 * can be concluded from a failure that has no size to work from.
 */
export const retrySizeCeiling = (
  { attemptedBytes, resultBytes }: OptimizerFailure,
  cap: number
): number => {
  if (attemptedBytes <= 0 || resultBytes <= 0) return 0
  const achieved = resultBytes / attemptedBytes
  // A pass that failed to shrink the file says nothing about a smaller one, so
  // the only safe bar is the cap itself.
  if (achieved >= 1) return Math.floor(cap * OPTIMIZER_RETRY_MARGIN)
  return Math.floor((cap * OPTIMIZER_RETRY_MARGIN) / achieved)
}

/** Whether retrying `nextBytes` cannot plausibly pass, so the run is wasted. */
export const isRetryPointless = (
  failure: OptimizerFailure,
  nextBytes: number,
  cap: number
): boolean => nextBytes > retrySizeCeiling(failure, cap)
