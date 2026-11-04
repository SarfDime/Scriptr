import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'

const normalize = (origin: string): string =>
  origin.trim().replace(/\/+$/, '').toLowerCase()

/**
 * Whether a request on an origin-restricted surface may proceed.
 *
 * Browsers always send `Origin` on a cross-origin request, so in production a
 * missing header is treated as a foreign caller rather than as a server. Local
 * `curl` and the route tests have no `Origin`, so they are allowed outside
 * production only. A spoofed header is still possible from a non-browser client
 * — this narrows an attacker's options and blocks a stolen token from being
 * replayed by a page on another site; the short-lived token remains the real
 * gate.
 */
export function isAllowedOrigin(
  c: Context<HonoEnv>,
  configuredOrigin: string | undefined,
  { allowMissing = false }: { allowMissing?: boolean } = {}
): boolean {
  const requestOrigin = c.req.header('origin')
  const configured = configuredOrigin ? normalize(configuredOrigin) : ''

  if (!requestOrigin) {
    // Server-rendered pages call the API from Node, where no Origin exists, so
    // a surface those pages use has to allow it. The token and the session are
    // still the gate there.
    return allowMissing || c.env.NODE_ENV !== 'production'
  }

  return configured.length > 0 && normalize(requestOrigin) === configured
}
