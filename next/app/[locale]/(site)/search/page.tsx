import { UI_STRINGS_PACK } from '@shared/config/strings'
import { localizedPath } from '@shared/utils/localized-path'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { SearchResultsSkeleton } from '@/components/search/SearchResultsSkeleton'
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

/**
 * The catalog search. Its heading is static; the query and the results it
 * produces are only known at request time, so the form and the list stream in
 * behind one boundary.
 */
export default async function SearchPage({
  params,
  searchParams,
}: LocalePageProps & {
  searchParams: Promise<{ q?: SearchQueryParam }>
}) {
  const { locale } = await params
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)

  return (
    <PageLayout>
      <PageHeader
        title={UI_STRINGS.scripts.search.pageTitle}
        subtitle={UI_STRINGS.scripts.search.pageSubtitle}
      />
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchScreen searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  )
}

async function SearchScreen({
  searchParams,
}: {
  searchParams: Promise<{ q?: SearchQueryParam }>
}) {
  const { q } = await searchParams
  const { query, results, failed } = await loadSearchPage(q)

  return (
    <>
      {/* Keyed so a header search while already on /search resets the input. */}
      <SearchForm key={query} query={query} />
      <Divider />
      <SearchResults query={query} results={results} failed={failed} />
    </>
  )
}
