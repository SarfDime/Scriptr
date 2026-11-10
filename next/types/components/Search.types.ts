/** One catalog result: where it is, and the text that says which one it is
 * (a faculty's university, a study's faculty). */
export type SearchResultItem = {
  id: string
  name: string
  /** Parent chain, shown under the name so two "Faculty of Medicine"s in
   * different universities are tellable apart. */
  context?: string
  href: string
}

export type SearchResultGroups = {
  universities: Array<SearchResultItem>
  faculties: Array<SearchResultItem>
  studies: Array<SearchResultItem>
  professors: Array<SearchResultItem>
}

export type SearchPageViewModel = {
  query: string
  results: SearchResultGroups
  /** The read failed, so empty groups mean "unknown", not "no matches" — the
   * two must not share copy. */
  failed: boolean
}
