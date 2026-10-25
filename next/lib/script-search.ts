import { INPUT_MAX_LENGTH } from '@shared/config/next-constants'

export const SEARCH_PAGE_PATH = '/search'
export const SEARCH_QUERY_PARAM = 'q'

export type SearchQueryParam = string | ReadonlyArray<string> | undefined

/** `?q=` can be repeated and anyone can edit the URL, so take the first value,
 * trim it, and cap it at the length the search input itself allows. */
export const normalizeSearchQuery = (raw: SearchQueryParam): string => {
  const value = typeof raw === 'string' ? raw : (raw?.[0] ?? '')
  return value.trim().slice(0, INPUT_MAX_LENGTH)
}

/** The one validity rule shared by the header bar and `/search` form: at
 * least one non-space character, at most `INPUT_MAX_LENGTH` once trimmed. These
 * are exactly the limits `normalizeSearchQuery` enforces when the page reads
 * `?q=`, so anything accepted here survives normalization unchanged. */
export const isValidSearchQuery = (raw: string): boolean => {
  const length = raw.trim().length
  return length > 0 && length <= INPUT_MAX_LENGTH
}

export const buildSearchHref = (query: string): string =>
  `${SEARCH_PAGE_PATH}?${new URLSearchParams({ [SEARCH_QUERY_PARAM]: query }).toString()}`
