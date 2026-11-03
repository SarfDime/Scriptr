/** Only the local dev apps; withheld in production so a hosted deployment
 * never answers a preflight for a loopback origin. */
const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3333',
]

type CorsOriginOptions = {
  configuredOrigins?: string
  nodeEnv?: string
}

/**
 * Resolves the `Access-Control-Allow-Origin` value for a request origin.
 * An empty string makes Hono omit the header, so the browser blocks the
 * response instead of exposing it to a disallowed origin.
 */
export function resolveCorsOrigin(
  origin: string,
  {
    configuredOrigins = process.env.CORS_ORIGINS,
    nodeEnv = process.env.NODE_ENV,
  }: CorsOriginOptions = {}
): string {
  const allowedOrigins = [
    ...(nodeEnv === 'production' ? [] : LOCAL_DEVELOPMENT_ORIGINS),
    ...(configuredOrigins?.split(',') ?? []),
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  // Entries like `*.scriptr.uk` match any https subdomain.
  const isAllowed = allowedOrigins.some((entry) => {
    if (!entry.startsWith('*.')) return entry === origin
    try {
      const url = new URL(origin)
      return url.protocol === 'https:' && url.hostname.endsWith(entry.slice(1))
    } catch {
      return false
    }
  })

  return isAllowed ? origin : ''
}
