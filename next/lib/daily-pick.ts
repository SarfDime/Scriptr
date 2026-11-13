const MS_PER_DAY = 86_400_000

/** UTC day number. Shared by the server render and the browser so a daily pick
 * is the same for every reader regardless of their timezone. */
export const dayNumber = (now: number) => Math.floor(now / MS_PER_DAY)

/** The item for `day`, cycling through `items` in their given order. */
export const pickByDay = <T>(
  items: ReadonlyArray<T>,
  day: number
): T | undefined => (items.length > 0 ? items[day % items.length] : undefined)
