import { getRequestCookieHeader } from '@/lib/api/next-api'
import { searchScripts } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  normalizeSearchQuery,
  type SearchQueryParam,
} from '@/lib/script-search'
import type { SearchPageViewModel } from '@/types/components/Search.types'

/** Loads the search page's view model. An empty query skips the API call
 * (`GET /scripts/search` rejects it with a 400). The request cookie is
 * forwarded so results are scoped to the signed-in user's faculties. */
export const loadSearchPage = async (
  rawQuery: SearchQueryParam
): Promise<SearchPageViewModel> => {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return { query, scripts: [] }

  const cookie = await getRequestCookieHeader()
  const scripts = toScriptSummaryDetails(await searchScripts(query, cookie))
  return { query, scripts }
}
