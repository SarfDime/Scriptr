import assert from 'node:assert/strict'
import type { OptimizeOutcome } from './types'

type Accepted = Extract<OptimizeOutcome, { ok: true }>

/** Asserts the outcome is a success and narrows it for the caller. */
export function assertAccepted(
  outcome: OptimizeOutcome
): asserts outcome is Accepted {
  assert.equal(outcome.ok, true, JSON.stringify(outcome))
}

/** Asserts the outcome is a rejection for exactly this reason. Rejections also
 * carry log details and sizes, which tests check separately. */
export const assertRejected = (outcome: OptimizeOutcome, reason: string) => {
  assert.equal(outcome.ok, false, JSON.stringify(outcome))
  if (!outcome.ok) assert.equal(outcome.reason, reason)
}
