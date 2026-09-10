/** A generic, immutable, weighted multi-criteria filter. */

/**
 * A single weighted criterion.
 *
 * This is written as a distributed mapped type (`{ [K in keyof T]: ... }[keyof T]`)
 * rather than a plain `{ key: keyof T, predicate: (value: any) => boolean }`
 * so that TypeScript correlates each criterion's `predicate` with the exact
 * value type of its own `key` — e.g. `{ key: 'price', predicate: (v: number) => ... }`
 * type-checks, but `{ key: 'price', predicate: (v: string) => ... }` does not.
 * This is what lets the whole utility avoid `any` entirely.
 */
export type WeightedCriterion<T> = {
  [K in keyof T]: {
    /** The property on `T` this criterion evaluates. */
    key: K
    /** Returns whether this criterion is satisfied for a given value. */
    predicate: (value: T[K]) => boolean
    /** Score contributed when `predicate` returns `true`. May be negative
     * to act as a penalty. */
    weight: number
  }
}[keyof T]

/**
 * Filters items by a total weighted score: for each item, every criterion
 * whose `predicate` returns `true` contributes its `weight` to a running
 * total, and the item is kept if that total is `>= minThreshold`.
 *
 * Edge-case behavior, by design:
 *  - Empty `items` -> `[]`.
 *  - Empty `criteria` -> every item scores `0`, so the result is either
 *    "all items" (if `minThreshold <= 0`) or `[]` (if `minThreshold > 0`).
 *    This falls out of the scoring logic naturally rather than being a
 *    special case, so behavior stays predictable.
 *  - A `predicate` that throws (e.g. calling `.toLowerCase()` on a `null`
 *    field) is treated as "criterion not met" for that item rather than
 *    aborting the whole filter — one bad/unguarded predicate shouldn't
 *    take down the entire list.
 *
 * @typeParam T - The item type.
 * @param items - The items to filter. Not mutated.
 * @param criteria - Weighted predicates to evaluate against each item.
 * @param minThreshold - Minimum total score (inclusive) required to keep an item.
 * @returns A new, filtered array.
 *
 * @example
 * ```ts
 * interface Product { price: number; inStock: boolean; category: string }
 *
 * const affordable = filterByWeight<Product>(
 *   products,
 *   [
 *     { key: 'price', predicate: (v) => v < 50, weight: 2 },
 *     { key: 'inStock', predicate: (v) => v === true, weight: 1 },
 *     { key: 'category', predicate: (v) => v === 'Clearance', weight: 3 },
 *   ],
 *   3, // needs e.g. "cheap + in stock" OR "clearance" alone to qualify
 * );
 * ```
 */
export const filterByWeight = <T extends object>(
  items: ReadonlyArray<T>,
  criteria: ReadonlyArray<WeightedCriterion<T>>,
  minThreshold: number
): Array<T> => {
  if (!items || items.length === 0) return []
  const safeCriteria = criteria ?? []

  return items.filter((item) => {
    let score = 0
    for (const criterion of safeCriteria) {
      const value = item[criterion.key]
      try {
        if (criterion.predicate(value)) {
          score += criterion.weight
        }
      } catch {
        // Throwing predicate on this field: contributes nothing, doesn't
        // fail the item outright or crash the overall filter.
      }
    }
    return score >= minThreshold
  })
}
