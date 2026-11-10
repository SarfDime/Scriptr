/**
 * The permanent handle a study site is served at, as one path segment:
 * `scriptr.uk/study/<siteSlug>`. Lowercase letters, digits and inner dashes.
 */
export const SITE_SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,59}[a-z0-9])?$/

/**
 * Handles a study may not take: route names it would shadow now or once the
 * study routes land, and hosts the platform already uses.
 *
 * Keep in sync with the `studies_site_slug_reserved` check constraint in
 * `hono/supabase/migrations/20261110154000_study_tenant_keys.sql`.
 */
export const RESERVED_SITE_SLUGS = [
  'www',
  'api',
  'admin',
  'sanity',
  'cdn',
  'files',
  'staging',
  'mail',
  'status',
  'preview',
  'app',
] as const satisfies ReadonlyArray<string>

export const isReservedSiteSlug = (value: string): boolean => {
  const normalized = value.toLowerCase()
  return RESERVED_SITE_SLUGS.some((reserved) => reserved === normalized)
}
