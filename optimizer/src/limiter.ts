/**
 * Runs at most `max` tasks at once; the rest wait their turn in arrival order.
 * Optimizing is CPU- and memory-heavy (a 20 MB photo decodes to hundreds of MB),
 * and a single finalize request can fan out to ten files.
 */
export const createConcurrencyLimiter = (max: number) => {
  let active = 0
  const waiting: Array<() => void> = []

  const release = () => {
    // Hand the slot straight to the next waiter, so a new caller can't slip in
    // between the release and the waiter resuming.
    const next = waiting.shift()
    if (next) next()
    else active -= 1
  }

  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= max) {
      await new Promise<void>((resolve) => waiting.push(resolve))
    } else {
      active += 1
    }
    try {
      return await task()
    } finally {
      release()
    }
  }
}
