import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleId,
} from '../config/localization-constants'

const isAbsoluteUrl = (value: string): boolean =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(value)

/** `/mk`, `/mk/…` — the prefix a non-default language adds to a pathname. */
const prefixPathname = (pathname: string, locale: LocaleId): string => {
  if (!pathname.startsWith('/')) return pathname
  if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
    return pathname
  }
  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
}

/**
 * The same address in `locale`, under `prefixDefault: false`: the default
 * language keeps the address it always had, every other language lives under
 * its own prefix.
 *
 * Accepts a site-relative path (`/university/ukim`) or an absolute URL — a
 * study's own host, `https://lbe.scriptr.uk/scripts/x` — because both are
 * minted by the same builders. A query string and a hash are kept. Applying it
 * twice is a no-op, so a path that already carries the prefix is safe.
 */
export const localizedPath = (pathOrUrl: string, locale: LocaleId): string => {
  if (locale === DEFAULT_LOCALE) return pathOrUrl

  if (isAbsoluteUrl(pathOrUrl)) {
    const url = new URL(pathOrUrl)
    const pathname = prefixPathname(url.pathname, locale)
    if (pathname === url.pathname) return pathOrUrl
    url.pathname = pathname
    return url.toString()
  }

  const suffixIndex = pathOrUrl.search(/[?#]/)
  const pathname =
    suffixIndex === -1 ? pathOrUrl : pathOrUrl.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : pathOrUrl.slice(suffixIndex)

  return `${prefixPathname(pathname, locale)}${suffix}`
}

/** A pathname without a language prefix, so each language's address can be
 * rebuilt from it. The default language's prefix is stripped too: it never
 * appears in a URL a reader types (the rewrite serves it unprefixed), but
 * `usePathname()` reports the rewritten path, which is `/en/…`. */
const stripLocalePrefix = (pathname: string): string => {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    }
  }
  return pathname
}

/**
 * The language-neutral address of a page: `localizedPath`'s inverse, used to
 * name a page in every language at once (`alternates.languages`, a sitemap
 * entry) and to switch language on the current page. Anything without a prefix
 * comes back unchanged.
 */
export const unprefixedPath = (pathOrUrl: string): string => {
  if (isAbsoluteUrl(pathOrUrl)) {
    const url = new URL(pathOrUrl)
    const pathname = stripLocalePrefix(url.pathname)
    if (pathname === url.pathname) return pathOrUrl
    url.pathname = pathname
    return url.toString()
  }

  const suffixIndex = pathOrUrl.search(/[?#]/)
  const pathname =
    suffixIndex === -1 ? pathOrUrl : pathOrUrl.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : pathOrUrl.slice(suffixIndex)

  return `${stripLocalePrefix(pathname)}${suffix}`
}
