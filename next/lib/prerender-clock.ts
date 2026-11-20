import { cacheLife } from 'next/cache'

/**
 * The clock as it stood when the shell was prerendered, for the two chrome
 * leaves that show "now" (`HeaderDate`, `FooterCopyright`).
 *
 * A render-time `new Date()` inside a Client Component is a prerender error, and
 * leaving the date out of the shell makes the header and footer shift once the
 * browser takes over. Cached, the value is a plain string the server can render;
 * each leaf then recomputes its own on the client.
 */
export const getPrerenderNow = async (): Promise<string> => {
  'use cache'
  cacheLife('max')

  return new Date().toISOString()
}
