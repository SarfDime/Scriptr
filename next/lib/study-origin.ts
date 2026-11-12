import { SITE_URL } from '@/config/env'

/**
 * A study's own hostname, derived from the site origin.
 *
 * `https://scriptr.uk` gives `scriptr.uk`, so a study handle `lbe` is served at
 * `https://lbe.scriptr.uk`. Deriving it instead of adding a second variable is
 * deliberate: a study domain that could disagree with the apex is a
 * misconfiguration waiting to happen, and every study link and canonical would
 * have to pick a winner.
 */

/** A slug the schema requires can still be absent at runtime (a doc saved
 * before the validation), which would mint `https://undefined.scriptr.uk`. */
const cleanSiteSlug = (siteSlug: string | null | undefined): string => {
  const slug = (siteSlug ?? '').trim()
  return slug.startsWith('drafts.') ? slug.slice('drafts.'.length) : slug
}

const toUrl = (): URL | null => {
  if (!SITE_URL) return null
  try {
    return new URL(SITE_URL)
  } catch {
    return null
  }
}

/** The apex host studies hang off, without a `www.` prefix (`scriptr.uk`, or
 * `localhost:3000` in development). Empty when the site origin is unusable. */
export const studySiteHost = (): string => {
  const url = toUrl()
  return url ? url.host.replace(/^www\./, '') : ''
}

/**
 * An absolute address on the catalog host, for a link a study site renders to
 * something the study does not own: `/admin`, `/user`, a professor, a
 * university.
 *
 * A *relative* one would be prefetched from the study host, answered by the
 * catalog-owned redirect, and the browser would block that cross-origin RSC
 * fetch — the link would log a CORS error and fall back to a hard reload. An
 * absolute address is skipped by the router's prefetch and navigates once.
 */
export const catalogUrl = (path: string): string => {
  const url = toUrl()
  return url ? `${url.protocol}//${studySiteHost()}${path}` : path
}

/** `https://lbe.scriptr.uk`, or `http://lbe.localhost:3000` in development.
 * Empty when the site origin is unusable or the study has no handle, so callers
 * can fall back to the catalog path. */
export const studySiteOrigin = (
  siteSlug: string | null | undefined
): string => {
  const slug = cleanSiteSlug(siteSlug)
  const url = toUrl()
  if (!slug || !url) return ''

  return `${url.protocol}//${slug}.${studySiteHost()}`
}
