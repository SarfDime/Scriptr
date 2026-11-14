import 'server-only'
import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleId,
} from '@shared/config/localization-constants'
import type { ResolvedStrings } from '@shared/types/localization.types'
import { getStrings } from '@shared/utils/localized-strings'
import { locale } from 'next/root-params'

/**
 * The language the matched route resolved to, for any Server Component or
 * server helper. `next/root-params` reads the `[locale]` segment of the request
 * that is rendering, so there is no prop to thread and no cookie to read — and
 * because the language is a build-time param it does not make a page dynamic.
 *
 * Only a render has a route locale. A route handler (the study sitemap, say) or
 * a `generateStaticParams` pass has no reader at all — Next rejects the call
 * there — and gets the default language, which is also what every localized
 * projection falls back to when `$locale` is missing. Nothing in those paths
 * renders copy: they read slugs.
 *
 * Server-only: a Client Component reads the same value from `useLocale()`.
 */
export const getServerLocale = async (): Promise<LocaleId> => {
  try {
    const active = await locale()
    return LOCALES.includes(active as LocaleId)
      ? (active as LocaleId)
      : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

/**
 * A string collection in the reader's language, for a Server Component and for
 * the server helpers it calls — the counterpart of `useStrings`. `getStrings`
 * memoises per collection and language, so several components awaiting the same
 * collection share one lookup.
 *
 * A page passes the `locale` from its own `params`; anything below it leaves
 * the argument out and reads the route param (`getServerLocale`). Both are the
 * same value — the page's segment is where the route param comes from.
 */
export const getServerStrings = async <T extends object>(
  strings: T,
  locale?: LocaleId
): Promise<ResolvedStrings<T>> =>
  getStrings(strings, locale ?? (await getServerLocale()))
