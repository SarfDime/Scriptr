'use client'

import type { OptimizerFailure } from '@shared/utils/optimizer-retry'

/**
 * What the optimizer managed to do to files it rejected in this session.
 *
 * Kept in module memory rather than storage: it only exists to stop the same
 * document being run through the optimizer twice in a row, and a page reload is
 * a reasonable place to forget. Keyed by file name, because a retry of the same
 * document is the same name at a different size — which is exactly the
 * comparison this needs.
 */
const failures = new Map<string, OptimizerFailure>()

const keyFor = (fileName: string) => fileName.trim().toLowerCase()

export const rememberOptimizerFailure = (
  fileName: string,
  failure: OptimizerFailure
) => {
  failures.set(keyFor(fileName), failure)
}

/** Forgets a file that has since been stored, so it can be uploaded again. */
export const forgetOptimizerFailure = (fileName: string) => {
  failures.delete(keyFor(fileName))
}

export const findOptimizerFailure = (
  fileName: string
): OptimizerFailure | undefined => failures.get(keyFor(fileName))
