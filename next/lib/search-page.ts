import { searchScripts } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  normalizeSearchQuery,
  type SearchQueryParam,
} from '@/lib/script-search'
import type { SearchPageViewModel } from '@/types/components/Search.types'

/** Loads the search page's view model. An empty query skips the API call
 * (`GET /scripts/search` rejects it with a 400). Search is public and
 * unscoped, so no cookie is forwarded — every viewer sees the same results. */
export const loadSearchPage = async (
  rawQuery: SearchQueryParam
): Promise<SearchPageViewModel> => {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return { query, scripts: [] }

  const scripts = toScriptSummaryDetails(await searchScripts(query))
  return { query, scripts }
}
