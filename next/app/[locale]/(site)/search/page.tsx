import { UI_STRINGS_PACK } from '@shared/config/strings'
import { localizedPath } from '@shared/utils/localized-path'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { Divider } from '@/components/ui/Divider'
import { languageAlternates } from '@/lib/localized-metadata'
import type { SearchQueryParam } from '@/lib/script-search'
import { loadSearchPage } from '@/lib/search-page'
import { getServerStrings } from '@/lib/server-strings'
import type { LocalePageProps } from '@/types/localization.types'

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const path = '/search'
  const { locale } = await params
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)

  return {
    title: UI_STRINGS.scripts.search.pageTitle,
    robots: { index: false, follow: true },
    alternates: {
      canonical: localizedPath(path, locale),
      languages: languageAlternates(path),
    },
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: LocalePageProps & {
  searchParams: Promise<{ q?: SearchQueryParam }>
}) {
  const [{ q }, { locale }] = await Promise.all([searchParams, params])
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)
  const { query, results, failed } = await loadSearchPage(q)

  return (
    <PageLayout>
      <PageHeader
        title={UI_STRINGS.scripts.search.pageTitle}
        subtitle={UI_STRINGS.scripts.search.pageSubtitle}
      />
      {/* Keyed so a header search while already on /search resets the input. */}
      <SearchForm key={query} query={query} />
      <Divider />
      <SearchResults query={query} results={results} failed={failed} />
    </PageLayout>
  )
}
