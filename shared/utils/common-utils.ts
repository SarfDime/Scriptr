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
  return [
    leadingSlash ? '/' : '',
    ...(segments || []),
    endsWithSlash ? '/' : '',
  ]
    .map((seg) => seg?.trim())
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
}

export { camelCase, capitalize, getAttribute }
