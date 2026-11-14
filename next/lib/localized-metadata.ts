import { LOCALES, type LocaleId } from '@shared/config/localization-constants'
import { localizedPath, unprefixedPath } from '@shared/utils/localized-path'

/**
 * One page's address in every language, for `alternates.languages` and a
 * sitemap entry's alternates. This is what keeps the two variants from
 * competing: each names the other, and the canonical names the one being served.
 *
 * The input may be either shape — `/university/ukim` or `/mk/university/ukim`,
 * a catalog path or a study's absolute URL — because it is normalised first.
 * `toAbsolute` turns each result into the form the consumer needs (hreflang and
 * a sitemap want absolute URLs; `metadata.alternates` accepts relative ones).
 */
export const languageAlternates = (
  pathOrUrl: string,
  toAbsolute: (path: string) => string = (path) => path
): Record<LocaleId, string> => {
  const base = unprefixedPath(pathOrUrl)

  return Object.fromEntries(
    LOCALES.map((locale) => [locale, toAbsolute(localizedPath(base, locale))])
  ) as Record<LocaleId, string>
}
