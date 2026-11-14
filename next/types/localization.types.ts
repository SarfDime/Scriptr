import type { LocaleId } from '@shared/config/localization-constants'

/**
 * The `[locale]` segment, as every page under `app/[locale]` receives it.
 *
 * It arrives as a plain string; what makes a `LocaleId` out of it is the root
 * layout, which `notFound()`s on a segment that is not a supported language
 * before any page below it renders (`[locale]` matches any first segment).
 */
export type LocaleRouteParams = { locale: LocaleId }

/**
 * Props of a page (or its `generateMetadata`) under `app/[locale]`. Pass the
 * page's own route params to get both: `LocalePageProps<{ username: string }>`.
 */
export type LocalePageProps<
  TRouteParams extends Record<string, string> = Record<never, string>,
> = {
  params: Promise<TRouteParams & LocaleRouteParams>
}
