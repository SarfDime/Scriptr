import type { LocaleId } from '@shared/config/localization-constants'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { Metadata } from 'next'
import { PageSEO } from '@/components/page-seo/PageSEO'
import { fetchWebsiteSeoSettings } from '@/lib/academic-detail-page'
import { convertToPlainText } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import type { LocalePageProps } from '@/types/localization.types'

/** The site's copy in the language the route resolved to, for the option
 * callbacks below — they run during metadata generation, where a hook is not
 * available. */
type AcademicStrings = ResolvedStrings<typeof UI_STRINGS_PACK>

/** Creates a `generateMetadata` function for an academic detail route, backed by `PageSEO`. */
export const createAcademicMetadata = <
  TDetail extends { name: string },
  TParams extends Record<string, string> = { slug: string },
>({
  query,
  seoQuery = query,
  resolveQueryParams,
  getPath,
  entityLabel,
  fetchOriginPrefix,
  getOwnSlug,
  getDescription,
  descriptionFallback,
  titleTemplate,
  tags,
}: {
  query: string
  seoQuery?: string
  /**
   * Maps the route's params to the query's params when the two differ — a study
   * site knows only its handle, while the shared queries take the slug tuple.
   * Returning `null` means the route does not exist.
   */
  resolveQueryParams?: (
    params: TParams,
    locale: LocaleId
  ) => Promise<Record<string, string> | null>
  /**
   * The page's own address, built from the route params with `getAcademicPath`:
   * a study's pages are absolute (they are served by the study's host), a
   * catalog page is a path. It must equal the URL the route is served at, since
   * it becomes the canonical and the Open Graph URL.
   */
  getPath: (params: TParams, locale: LocaleId) => string
  /** The entity's name in the reader's language — "University", "Study". */
  entityLabel: (strings: AcademicStrings) => string
  fetchOriginPrefix: string
  /** Pulls the page's own (leaf) slug out of the full route-params object, for logging/SEO param. */
  getOwnSlug: (params: TParams) => string
  /** The entity's rich-text description, flattened into the meta description.
   * Omitted by a sub-page of the entity (a study's script feed), which has a
   * description of its own rather than the parent's. */
  getDescription?: (detail: TDetail) => PortableTextValue
  descriptionFallback: (detail: TDetail, strings: AcademicStrings) => string
  /** The title without the site name. Defaults to the entity's name; a sub-page
   * of the entity passes its own so two pages of one entity do not share a
   * title. */
  titleTemplate?: (detail: TDetail, strings: AcademicStrings) => string
  tags?: ReadonlyArray<string>
}) => {
  return async ({ params }: LocalePageProps<TParams>): Promise<Metadata> => {
    const routeParams = await params
    const { locale } = routeParams
    const strings = await getServerStrings(UI_STRINGS_PACK, locale)
    const ownSlug = getOwnSlug(routeParams)
    const queryParams = resolveQueryParams
      ? await resolveQueryParams(routeParams, locale)
      : routeParams

    const [detail, websiteSettings] = await Promise.all([
      queryParams
        ? fetchSanityData<TDetail | null>({
            query: seoQuery,
            params: queryParams,
            locale,
            fetchOrigin: `${fetchOriginPrefix}-metadata-${ownSlug}`,
            tags,
          }).catch(() => null)
        : Promise.resolve(null),
      fetchWebsiteSeoSettings(),
    ])

    if (!detail) {
      return {
        title: strings.academics.metadata.notFoundTitle(
          entityLabel(strings),
          websiteSettings.siteName ?? 'Scriptr'
        ),
      }
    }

    const seoDescription =
      convertToPlainText({
        value: getDescription ? getDescription(detail) : undefined,
      }) || descriptionFallback(detail, strings)

    return PageSEO({
      seoTitle: `${titleTemplate ? titleTemplate(detail, strings) : detail.name} | ${
        websiteSettings.siteName ?? 'Scriptr'
      }`,
      seoDescription,
      pagePath: getPath(routeParams, locale),
      siteName: websiteSettings.siteName,
      siteUrl: websiteSettings.siteUrl,
      keywords: websiteSettings.defaultKeywords,
    })
  }
}
