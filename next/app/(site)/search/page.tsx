import { UI_STRINGS } from '@shared/config/strings'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { Divider } from '@/components/ui/Divider'
import type { SearchQueryParam } from '@/lib/script-search'
import { loadSearchPage } from '@/lib/search-page'

export const metadata: Metadata = {
  title: UI_STRINGS.scripts.search.pageTitle,
  robots: { index: false, follow: true },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: SearchQueryParam }>
}) {
  const { q } = await searchParams
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
