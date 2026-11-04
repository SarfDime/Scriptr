/**
 * Shape checks for the storage keys a signed `/optimize` call may name.
 *
 * The HMAC proves the caller holds `OPTIMIZER_SECRET`, which today means the
 * API — but the request body decides *which* object is read, written and
 * deleted. Constraining the shape keeps a leaked secret from reaching keys
 * outside the convention the API itself mints (`avatars/<userId>`,
 * `<…>/<uuid>`, `staging/<userId>/<uuid>.<ext>`).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEGMENT = /^[A-Za-z0-9._-]+$/
const STAGING_KEY = /^staging\/[A-Za-z0-9._-]+\/[0-9a-f-]{36}\.[A-Za-z0-9]+$/
const BUCKET_NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

const MAX_KEY_LENGTH = 512

/** Rejects empty segments, traversal and anything outside the key alphabet. */
export const isSafeObjectKey = (key: string): boolean => {
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) return false

  return (
    key
      .split('/')
      .every(
        (segment) =>
          segment !== '.' && segment !== '..' && SEGMENT.test(segment)
      ) &&
    !key.startsWith('/') &&
    !key.endsWith('/')
  )
}

/** The only staging keys the API mints: `staging/<userId>/<uuid>.<ext>`. */
export const isStagingKey = (key: string): boolean => STAGING_KEY.test(key)

/** Every destination base the API mints ends in a generated id:
 * `avatars/<userId>` or `<…>/<uuid>`, so a base that ends anywhere else (an
 * `index.html`, a prefix without an id) is not one of ours. */
export const isDestinationKeyBase = (base: string): boolean => {
  if (!isSafeObjectKey(base)) return false

  const segments = base.split('/')
  const last = segments.at(-1) ?? ''

  return segments.length >= 2 && UUID.test(last)
}

/** R2/S3 bucket-name rules, matching what the API accepts for a university. */
export const isSafeBucketName = (bucket: string): boolean =>
  BUCKET_NAME.test(bucket)
