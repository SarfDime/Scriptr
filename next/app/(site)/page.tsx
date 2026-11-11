import { UI_STRINGS } from '@shared/config/strings'
import { CatalogHomeContent } from '@/components/academics/catalog/CatalogHomeContent'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { fetchSanityData } from '@/sanity/lib/utils'
import { catalogHomeQuery } from '@/sanity/queries/catalog-home.queries'
import type { CatalogHome } from '@/types/academics/catalog.types'

/**
 * The root is the catalog, not a study's surface: a page header carrying the
 * two ways in, then the universities, faculties and studies. Each study leads
 * to its own site at `/study/[siteSlug]`, which is where subjects, professors
 * and scripts live.
 *
 * Cached until the publish webhook invalidates it, like the rest of the catalog.
 * A failed read renders the empty states rather than an error page.
 */
export const revalidate = false

export default async function CatalogHomePage() {
  const catalog = await fetchSanityData<CatalogHome>({
    query: catalogHomeQuery,
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
            <NextLink href='/start' className='button subtle'>
              {UI_STRINGS.home.setUpStudies}
            </NextLink>
            <NextLink href='/auth' className='button solid'>
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
