/**
 * The caller's address as the platform reports it. Only used to key rate
 * limits, so an unparseable or missing header falls back to one bucket rather
 * than rejecting the request.
 */
export const clientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown-ip'
