type RateLimiterOptions = {
  /** Requests allowed per window. */
  limit: number
  windowMs: number
  /** Also count blocked requests, so a client that keeps hammering stays
   * blocked until it has been quiet for a full window. */
  countBlocked?: boolean
  /** Clock override, for tests. */
  now?: () => number
}

const PURGE_EVERY_N_CHECKS = 256

/**
 * An in-memory sliding-window limiter. Returns `isLimited(key)`, which
 * records the request and reports whether it is over the limit.
 *
 * State lives in one server instance (a serverless instance keeps it only
 * while warm), so this is abuse friction rather than an exact quota.
 */
export const createRateLimiter = ({
  limit,
  windowMs,
  countBlocked = false,
  now = Date.now,
}: RateLimiterOptions) => {
  const buckets = new Map<string, Array<number>>()
  let checks = 0

  const purgeExpired = (currentTime: number) => {
    for (const [key, timestamps] of buckets) {
      const newest = timestamps.at(-1)
      if (newest === undefined || currentTime - newest >= windowMs) {
        buckets.delete(key)
      }
    }
  }

  return (key: string): boolean => {
    const currentTime = now()
    checks += 1
    if (checks % PURGE_EVERY_N_CHECKS === 0) purgeExpired(currentTime)

    const recent = (buckets.get(key) ?? []).filter(
      (timestamp) => currentTime - timestamp < windowMs
    )
    const blocked = recent.length >= limit
    if (!blocked || countBlocked) recent.push(currentTime)
    // Only the newest `limit` timestamps can decide the next answer, so a
    // client hammering the endpoint can't grow its own bucket without bound.
    buckets.set(key, recent.slice(-limit))
    return blocked
  }
}
