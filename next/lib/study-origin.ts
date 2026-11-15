import type { LocaleId } from '@shared/config/localization-constants'
import { localizedPath } from '@shared/utils/localized-path'
import { getStudySitePath } from '@shared/utils/site-paths'
import { SITE_URL, STUDY_HOSTS } from '@/config/env'

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

/** The apex host studies hang off, without a `www.` prefix (`scriptr.uk`).
 * Empty when study hosts are off — a localhost origin by default — or when the
 * site origin is unusable, and every caller then falls back to the catalog path. */
export const studySiteHost = (): string => {
  const url = toUrl()
  return url && STUDY_HOSTS ? url.host.replace(/^www\./, '') : ''
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
export const catalogUrl = (path: string, locale: LocaleId): string => {
  // An entity that lives on its own host already names it (`getAcademicPath`);
  // re-basing that onto the catalog would nest one origin inside another.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path

  const localized = localizedPath(path, locale)
  const url = toUrl()
  const host = studySiteHost()
  return url && host ? `${url.protocol}//${host}${localized}` : localized
}

/** `/study/<handle>` and anything under it. */
const STUDY_PATH = /^\/study\/([^/?#]+)(.*)$/

/**
 * A catalog-minted study path — `/study/lbe/scripts/x`, what `getScriptSitePath`
 * returns and what the API puts in a notification href — as the study's own
 * address. Anything else, including a path carrying no handle, comes back
 * unchanged.
 *
 * It matters as a link: the router prefetches a relative href, the study host
 * answers with a cross-origin redirect, and the browser blocks that fetch.
 */
export const studyUrlFromPath = (href: string, locale: LocaleId): string => {
  const match = STUDY_PATH.exec(href ?? '')
  if (!match) return href

  const origin = studySiteOrigin(match[1])
  return origin
    ? localizedPath(`${origin}${match[2] || '/'}`, locale)
    : localizedPath(href, locale)
}

/** `https://lbe.scriptr.uk`, or `http://lbe.localhost:3000` in development.
 * Empty when the site origin is unusable or the study has no handle, so callers
 * can fall back to the catalog path. */
export const studySiteOrigin = (
  siteSlug: string | null | undefined
): string => {
  const slug = cleanSiteSlug(siteSlug)
  const url = toUrl()
  const host = studySiteHost()
  if (!slug || !url || !host) return ''

  return `${url.protocol}//${slug}.${host}`
}

/**
 * A path on a study's own site, in the shape this build serves it: `/scripts`
 * when the study has a host (the rewrite maps it onto the study tree, so the
 * path the reader sees names nothing), `/study/<label>/scripts` when studies
 * are reached by path. The host is a build-time fact (`studySiteHost`), not a
 * per-request one, so this needs no host read and stays usable from a Client
 * Component.
 */
export const studySitePath = (
  siteSlug: string,
  path: string,
  locale: LocaleId
): string => {
  if (studySiteHost()) return localizedPath(path, locale)

  const site = cleanSiteSlug(siteSlug)
  return localizedPath(`${getStudySitePath(site)}${path}`, locale)
}
