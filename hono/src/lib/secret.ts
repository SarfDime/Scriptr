import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time comparison for a shared secret or a short code. Lengths are
 * compared first because `timingSafeEqual` throws on a mismatch, and a secret
 * of the wrong length is already a rejection.
 */
export const matchesSecret = (expected: string, provided: string): boolean => {
  const left = Buffer.from(expected)
  const right = Buffer.from(provided)
  return left.length === right.length && timingSafeEqual(left, right)
}
