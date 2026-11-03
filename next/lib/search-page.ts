import { searchScripts } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  normalizeSearchQuery,
  type SearchQueryParam,
} from '@/lib/script-search'
import type { SearchPageViewModel } from '@/types/components/Search.types'

/** Loads the search page's view model. An empty query skips the API call
 * (`GET /scripts/search` rejects it with a 400). Search is public and
 * unscoped, so no cookie is forwarded — every viewer sees the same results.
 *
 * A failed request is reported as `failed`, not as an empty result list:
 * "no scripts match" and "the search never ran" need different copy. */
export const loadSearchPage = async (
  rawQuery: SearchQueryParam
): Promise<SearchPageViewModel> => {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return { query, scripts: [], failed: false }

  const scripts = await searchScripts(query)
  if (!scripts) return { query, scripts: [], failed: true }

  return { query, scripts: toScriptSummaryDetails(scripts), failed: false }
}
