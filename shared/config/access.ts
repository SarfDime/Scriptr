/**
 * Constants for the two surfaces that are not session-authenticated: the
 * Studio's TOTP-gated routes and the sitemap read.
 *
 * They live in `shared/` because the API writes these headers and the Studio
 * and the Next build send them; a literal on each side that drifts apart fails
 * silently at runtime.
 */

/** Header carrying the short-lived token issued by the access-code exchange. */
export const ACCESS_TOKEN_HEADER = 'x-admin-token'

/** Cookie the website stores the same token in: server-rendered pages cannot
 * hold it in memory the way the Studio does. HttpOnly, so page scripts can
 * never read it. */
export const ADMIN_ACCESS_COOKIE = 'scriptr-admin-access'

/** Header scoping the sitemap's script list. Only the Next build holds it. */
export const SITEMAP_SECRET_HEADER = 'x-sitemap-secret'

/** Headers of the signed server-to-server calls: the API signs
 * `${timestamp}.${body}` with the shared secret and the callee verifies it, so
 * the secret itself never travels and a captured request cannot be replayed. */
export const OPTIMIZER_TIMESTAMP_HEADER = 'x-optimizer-timestamp'
export const OPTIMIZER_SIGNATURE_HEADER = 'x-optimizer-signature'
export const REVALIDATE_TIMESTAMP_HEADER = 'x-revalidate-timestamp'
export const REVALIDATE_SIGNATURE_HEADER = 'x-revalidate-signature'

/** How long an exchanged access token stays valid. */
export const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000

/** Digits in the TOTP code an operator types, and how long each one is good
 * for. Verification accepts the current step and one either side, so a code
 * stays usable for 30–90 seconds. */
export const ACCESS_CODE_LENGTH = 6
export const ACCESS_CODE_STEP_SECONDS = 30
