/**
 * Paths of the study site's public pages, shared by the API and the web app.
 *
 * The API mints absolute paths into notifications and admin payloads, and the
 * web app builds the same links from catalog data. Both shapes live here so a
 * study link cannot drift between them — the API has been pointing at
 * `/scripts/<id>` since before study sites existed.
 */

/** A slug that is missing or still a draft has no page. */
const cleanSegment = (value: string | null | undefined): string => {
  const segment = (value ?? '').trim()
  return segment.startsWith('drafts.')
    ? segment.slice('drafts.'.length)
    : segment
}

/** A study site's root: `/study/<siteSlug>`, or the catalog when the study has
 * no handle yet. */
export const getStudySitePath = (
  siteSlug: string | null | undefined
): string => {
  const site = cleanSegment(siteSlug)
  return site ? `/study/${site}` : '/'
}

/** A script's page inside its study: `/study/<siteSlug>/scripts/<slug>`. A
 * script whose study has no handle (or whose caller did not read one) keeps the
 * old top-level path, which the web app forwards. */
export const getScriptSitePath = (script: {
  siteSlug?: string | null
  slug: string
}): string => {
  const site = cleanSegment(script.siteSlug)
  const slug = cleanSegment(script.slug)
  return site ? `${getStudySitePath(site)}/scripts/${slug}` : `/scripts/${slug}`
}

/**
 * The study site a path belongs to, read back out of the URL: `/study/lbe/…`
 * gives `lbe`, and a catalog path gives null. The browser needs this to decide
 * which study a page is showing without resolving a slug to a database id.
 *
 * A study's own pages are addressed by their host (`lbe.scriptr.uk/scripts`), so
 * the path names nothing there — see `getSiteSlugFromHost`.
 */
export const getSiteSlugFromPath = (pathname: string): string | null => {
  const [path] = pathname.split('?')
  const segments = (path ?? '').split('/').filter(Boolean)
  return segments[0] === 'study' && segments[1] ? segments[1] : null
}

/**
 * The study site a hostname serves: `lbe.scriptr.uk` with the catalog on
 * `scriptr.uk` gives `lbe`. The catalog's own host, `www`, and anything not a
 * single-label subdomain of it give null, so an unknown host never looks like a
 * study.
 */
export const getSiteSlugFromHost = (
  host: string,
  siteHost: string
): string | null => {
  const candidate = (host ?? '').toLowerCase().replace(/^www\./, '')
  const base = (siteHost ?? '').toLowerCase().replace(/^www\./, '')
  if (!candidate || !base || !candidate.endsWith(`.${base}`)) return null

  const label = candidate.slice(0, -(base.length + 1))
  return label && !label.includes('.') ? label : null
}
