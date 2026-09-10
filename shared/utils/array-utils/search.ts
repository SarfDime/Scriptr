/** A generic, immutable, weighted fuzzy search over an array of objects. */

/** A target key to search, with its relative importance. */
export interface FuzzySearchKeyWeight<T> {
  /** The property on `T` to search. Its value is stringified for comparison. */
  key: keyof T
  /** Relative importance of a match in this field. Higher = more influence
   * on the final ranking. */
  weight: number
}

const EXACT_MATCH_SCORE = 1
const STARTS_WITH_SCORE = 0.9
const CONTAINS_SCORE = 0.75
/** Below this normalized similarity, a near-miss is treated as "no match"
 * rather than a very-low-relevance one, so unrelated text doesn't clutter
 * results. */
const FUZZY_MATCH_THRESHOLD = 0.4
/** Fuzzy (typo-tolerant) matches are capped below `CONTAINS_SCORE` so an
 * approximate match never outranks a real substring match. */
const FUZZY_SCORE_MULTIPLIER = 0.6

/**
 * Levenshtein edit distance between two strings: the minimum number of
 * single-character insertions, deletions, or substitutions needed to turn
 * `a` into `b`. Implemented with the standard Wagner-Fischer DP, using two
 * rolling rows instead of a full matrix for O(min(n, m)) space.
 */
const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let previousRow: Array<number> = []
  for (let j = 0; j <= b.length; j += 1) previousRow.push(j)

  for (let i = 1; i <= a.length; i += 1) {
    const currentRow: Array<number> = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      const deletion = (previousRow[j] ?? 0) + 1
      const insertion = (currentRow[j - 1] ?? 0) + 1
      const substitution = (previousRow[j - 1] ?? 0) + substitutionCost
      currentRow.push(Math.min(deletion, insertion, substitution))
    }
    previousRow = currentRow
  }

  return previousRow[b.length] ?? Math.max(a.length, b.length)
}

/**
 * Scores a single field against an already-normalized (lowercased,
 * trimmed) query. Layers cheap exact/prefix/substring checks before
 * falling back to edit-distance fuzziness, so obvious matches don't pay
 * for a DP pass and typo-tolerance is only used when it's needed.
 *
 * Note: this compares the *whole* field value against the query, so it
 * suits short-to-medium fields (names, titles, tags, categories). A typo
 * inside one word of a long free-text field (e.g. a paragraph-length
 * description) may not score well via the fuzzy fallback, since the edit
 * distance is measured across the full field length — the exact/prefix/
 * substring checks still catch a verbatim (non-typo'd) match anywhere in
 * such a field, though.
 */
const computeFieldScore = (
  normalizedQuery: string,
  rawValue: unknown
): number => {
  if (rawValue === null || rawValue === undefined) return 0

  const text = String(rawValue).toLowerCase().trim()
  if (text.length === 0) return 0

  if (text === normalizedQuery) return EXACT_MATCH_SCORE
  if (text.startsWith(normalizedQuery)) return STARTS_WITH_SCORE
  if (text.includes(normalizedQuery)) return CONTAINS_SCORE

  const distance = levenshteinDistance(normalizedQuery, text)
  const maxLength = Math.max(normalizedQuery.length, text.length)
  const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength

  return similarity >= FUZZY_MATCH_THRESHOLD
    ? similarity * FUZZY_SCORE_MULTIPLIER
    : 0
}

/**
 * Searches `items` across several weighted keys and returns matches
 * ordered by descending relevance. Matching tolerates typos (via edit
 * distance) but favors exact, prefix, and substring hits, which are
 * always scored higher than a fuzzy near-miss.
 *
 * Edge-case behavior, by design:
 *  - Empty/whitespace-only `query` -> returns a shallow copy of `items`,
 *    unranked, in their original order (an empty search box conventionally
 *    means "show everything," not "match nothing").
 *  - Empty `items` -> `[]`.
 *  - Empty `keys` -> `[]` (there is nothing to compare the query against).
 *  - `null`/`undefined` field values contribute a score of `0` for that
 *    field rather than being stringified to `"null"`/`"undefined"` (which
 *    would otherwise create false matches for a query like `"null"`).
 *  - Items with a total score of `0` across all keys are excluded from
 *    the result entirely (they're non-matches, not just low-ranked ones).
 *
 * @typeParam T - The item type.
 * @param items - The items to search. Not mutated.
 * @param query - The raw search string (any casing/whitespace).
 * @param keys - Which fields to search and how much each should count.
 * @returns Matching items only, ordered by descending relevance score.
 *
 * @example
 * ```ts
 * interface Product { name: string; category: string; tags: string }
 *
 * const results = fuzzySearch(products, 'wireles keybord', [
 *   { key: 'name', weight: 3 },
 *   { key: 'tags', weight: 2 },
 *   { key: 'category', weight: 1 },
 * ]);
 * // -> products with "Wireless Keyboard"-like names rank first despite
 * //    the two typos, tag/category matches contribute less per hit.
 * ```
 */
export const fuzzySearch = <T extends object>(
  items: ReadonlyArray<T>,
  query: string,
  keys: ReadonlyArray<FuzzySearchKeyWeight<T>>
): Array<T> => {
  if (!items || items.length === 0) return []

  const normalizedQuery = (query ?? '').toLowerCase().trim()
  if (normalizedQuery.length === 0) return [...items]
  if (!keys || keys.length === 0) return []

  const scored: Array<{ item: T; score: number }> = []
  for (const item of items) {
    let totalScore = 0
    for (const { key, weight } of keys) {
      totalScore += computeFieldScore(normalizedQuery, item[key]) * weight
    }
    if (totalScore > 0) {
      scored.push({ item, score: totalScore })
    }
  }

  // Array.prototype.sort is stable (ES2019+), so equal-score items keep
  // their original relative order.
  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.item)
}
