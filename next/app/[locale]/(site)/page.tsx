import { UI_STRINGS_PACK } from '@shared/config/strings'
import { localizedPath } from '@shared/utils/localized-path'
import type { Metadata } from 'next'
import { CatalogHomeContent } from '@/components/academics/catalog/CatalogHomeContent'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { languageAlternates } from '@/lib/localized-metadata'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { getServerStrings } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { catalogHomeQuery } from '@/sanity/queries/catalog-home.queries'
import type { CatalogHome } from '@/types/academics/catalog.types'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * The root is the catalog, not a study's surface: a page header carrying the
 * two ways in, then the universities, faculties and studies. Each study leads
 * to its own site at `/study/[siteSlug]`, which is where subjects, professors
 * and scripts live.
 *
 * Cached until the publish webhook invalidates it, like the rest of the catalog.
 * A failed read renders the empty states rather than an error page.
 */
export const ensureStatic = 'navigation'

/** The root is one page in two languages, so each names the other. Everything
 * else — title, description, Open Graph — comes from the root layout. */
export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const path = '/'
  const { locale } = await params

  return {
    alternates: {
      canonical: localizedPath(path, locale),
      languages: languageAlternates(path),
    },
  }
}

export default async function CatalogHomePage({ params }: LocalePageProps) {
  const { locale } = await params
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)
  const catalog = await fetchSanityData<CatalogHome>({
    query: catalogHomeQuery,
    locale,
    fetchOrigin: 'catalog-home',
    tags: ACADEMIC_CATALOG_TAGS,
  })

  return (
    <PageLayout
      header={{
        greeting: UI_STRINGS.home.greeting,
        title: UI_STRINGS.home.title,
        subtitle: UI_STRINGS.home.subtitle,
        actions: (
          <>
            <NextLink
              href={localizedPath('/start', locale)}
              className='button subtle'
            >
              {UI_STRINGS.home.setUpStudies}
            </NextLink>
            <NextLink
              href={localizedPath('/auth', locale)}
              className='button solid'
            >
              {UI_STRINGS.home.createAccount}
            </NextLink>
          </>
        ),
      }}
    >
      <Divider />
      <CatalogHomeContent
        catalog={catalog ?? { universities: [], studies: [] }}
      />
    </PageLayout>
  )
}
