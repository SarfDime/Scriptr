/** A generic, immutable, multi-key array sorter. */

/** Sort direction for a single rule. */
export type SortDirection = 'asc' | 'desc'

/**
 * A single ordering rule. Rules are evaluated in array order, so the
 * first rule is the primary sort key and subsequent rules only act as
 * tie-breakers for items that compare equal on every prior rule.
 */
export interface SortRule<T> {
  /** The property on `T` to compare. */
  key: keyof T
  /** Sort direction for this key. Defaults to `'asc'`. */
  direction?: SortDirection
}

/**
 * Compares two arbitrary field values with sensible, type-aware rules:
 *  - `null`/`undefined` are always sorted after every defined value,
 *    regardless of the requested direction (so missing data never
 *    "jumps to the top" just because a rule is descending).
 *  - `Date` instances compare by timestamp.
 *  - `number`s compare numerically, with `NaN` treated like a missing value.
 *  - `boolean`s compare as `false < true`.
 *  - Everything else (including mixed types) falls back to a locale-aware
 *    string comparison via `localeCompare`, which is the only safe way to
 *    order strings (it respects accents, case, and locale collation rules
 *    that simple `<`/`>` comparison gets wrong).
 *
 * Kept as an internal helper (not exported) because its `unknown, unknown`
 * signature is an implementation detail — callers only ever see the
 * strongly-typed `SortRule<T>` API.
 */
const compareValues = (a: unknown, b: unknown): number => {
  const aIsNullish = a === null || a === undefined
  const bIsNullish = b === null || b === undefined
  if (aIsNullish || bIsNullish) {
    if (aIsNullish && bIsNullish) return 0
    return aIsNullish ? 1 : -1
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  if (typeof a === 'number' && typeof b === 'number') {
    const aIsNaN = Number.isNaN(a)
    const bIsNaN = Number.isNaN(b)
    if (aIsNaN || bIsNaN) {
      if (aIsNaN && bIsNaN) return 0
      return aIsNaN ? 1 : -1
    }
    return a - b
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b)
  }

  // Fallback: safe locale-aware string comparison (also covers the
  // mixed-type case, e.g. a field that is `10` on one record and `"10"`
  // on another).
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

/**
 * Immutably sorts an array by one or more keys, in priority order.
 *
 * The input array is never mutated — a new array is always returned,
 * even when `rules` is empty (in which case a shallow copy is returned
 * unchanged).
 *
 * @typeParam T - The item type. Constrained to `object` since sorting is
 *   always performed by named property (`keyof T`).
 * @param items - The items to sort. Not mutated.
 * @param rules - Ordered list of `{ key, direction }` rules. The first
 *   rule is the primary sort; later rules break ties left by earlier ones.
 * @returns A new, sorted array.
 *
 * @example
 * ```ts
 * interface Product { name: string; category: string; price: number }
 *
 * const sorted = sortArray(products, [
 *   { key: 'category', direction: 'asc' },
 *   { key: 'price', direction: 'desc' },
 * ]);
 * // -> sorted by category A→Z, then by price high→low within each category
 * ```
 *
 * @example Edge cases
 * ```ts
 * sortArray([], [{ key: 'price' }]);        // -> [] (new empty array)
 * sortArray(products, []);                   // -> shallow copy, original order kept
 * sortArray([{ price: undefined }, { price: 1 }], [{ key: 'price' }]);
 * // -> [{ price: 1 }, { price: undefined }]  (nullish values always sort last)
 * ```
 */
export const sortArray = <T extends object>(
  items: ReadonlyArray<T>,
  rules: ReadonlyArray<SortRule<T>>
): Array<T> => {
  if (!items || items.length === 0) return []
  if (!rules || rules.length === 0) return [...items]

  return [...items].sort((a, b) => {
    for (const rule of rules) {
      const direction = rule.direction ?? 'asc'
      const comparison = compareValues(a[rule.key], b[rule.key])
      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}
