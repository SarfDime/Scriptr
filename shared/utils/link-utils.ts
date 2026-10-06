/**
 * Validation for a script's "additional reading" links. Lives in `shared/` so
 * the create-script form and the Hono `POST /scripts` / `PATCH /scripts/:id`
 * validators apply identical rules.
 */

export const MAX_READING_LINK_LENGTH = 2048

export type ReadingLinkError = 'invalid' | 'protocol' | 'tooLong' | 'duplicate'

/** Canonical form used for duplicate detection (case-insensitive host, no
 * trailing slash, no fragment). */
const toComparableLink = (url: URL): string => {
  const copy = new URL(url.href)
  copy.hash = ''
  return copy.href.replace(/\/$/, '')
}

/** Error for one link in isolation, or `null` when it is valid. Blank values
 * are not errors: blank rows are ignored (and should be stripped before
 * submit). Only `http:` and `https:` are accepted, which blocks
 * `javascript:`, `data:` and similar schemes. */
export const getReadingLinkError = (value: string): ReadingLinkError | null => {
  const link = value.trim()
  if (link === '') return null
  if (link.length > MAX_READING_LINK_LENGTH) return 'tooLong'

  let url: URL
  try {
    url = new URL(link)
  } catch {
    return 'invalid'
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'protocol'
  if (!url.hostname.includes('.')) return 'invalid'
  return null
}

/** Per-link errors for the whole list, index-aligned with `links`. The second
 * and later occurrences of the same URL are flagged as duplicates. */
export const getReadingLinkErrors = (
  links: ReadonlyArray<string>
): Array<ReadingLinkError | null> => {
  const seen = new Set<string>()

  return links.map((link) => {
    const error = getReadingLinkError(link)
    if (error !== null || link.trim() === '') return error

    const key = toComparableLink(new URL(link.trim()))
    if (seen.has(key)) return 'duplicate'
    seen.add(key)
    return null
  })
}

/** Trimmed, non-blank links, ready to send. Call after validation passes. */
export const cleanReadingLinks = (
  links: ReadonlyArray<string>
): Array<string> =>
  links.map((link) => link.trim()).filter((link) => link !== '')
