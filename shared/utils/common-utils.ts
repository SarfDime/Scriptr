import { TIME_AGO_STRINGS } from '@shared/strings/time-strings'

/**
 * Returns an object with the specified attribute name and value if the condition is true, otherwise returns an empty object.
 */
const getAttribute = <T extends string, U>(
  condition: boolean,
  attributeName: T,
  attributeValue: U
) => {
  return condition && attributeValue
    ? ({ [attributeName]: attributeValue } as { [K in T]: U })
    : undefined
}

/** Converts a kebab-case string to camelCase. */
const camelCase = (str: string) =>
  str.replace(/-([a-z])/g, (_, char) => char.toUpperCase())

/**  Capitalizes the first character of a string.*/
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

/**
 * Joins an array of segments into a single path string, with optional leading and ending trailing slash.
 *
 * - `segments` - An array of segments to join into a path.
 * - `leadingSlash` - Whether to include a leading slash in the path. Defaults to false.
 * - `endsWithSlash` - Whether to include a trailing slash at the end of the path. Defaults to false.
 */
export const generatePath = ({
  segments,
  leadingSlash = false,
  endsWithSlash = false,
}: {
  segments: Array<string>
  leadingSlash?: boolean
  endsWithSlash?: boolean
}): string => {
  return (
    [leadingSlash ? '/' : '', ...(segments || []), endsWithSlash ? '/' : '']
      .map((seg) => seg?.trim())
      .filter(Boolean)
      .join('/')
      // Replaces 2 or more slashes with a single slash,
      // EXCEPT when they are preceded by a colon (e.g., http://)
      .replace(/(?<!:)\/{2,}/g, '/')
  )
}

/** Generates random key */
export const generateRandomKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

/** Formats a given date string into a human-readable string indicating how long ago it was updated. */
export const formatDate = (dateString: string): string => {
  const parsedDate = new Date(dateString)

  const date = Number.isNaN(parsedDate.getTime())
    ? new Date(dateString.replace(/\.\d+/, (match) => match.slice(0, 4)))
    : parsedDate

  if (Number.isNaN(date.getTime())) return TIME_AGO_STRINGS.invalidDate

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return TIME_AGO_STRINGS.justNow
  if (diffMinutes === 1) return TIME_AGO_STRINGS.oneMinuteAgo
  if (diffMinutes < 60) return TIME_AGO_STRINGS.minutesAgo(diffMinutes)
  if (diffHours === 1) return TIME_AGO_STRINGS.anHourAgo
  if (diffHours < 24) return TIME_AGO_STRINGS.hoursAgo(diffHours)
  if (diffDays === 1) return TIME_AGO_STRINGS.yesterday
  return TIME_AGO_STRINGS.daysAgo(diffDays)
}

export { camelCase, capitalize, getAttribute }
