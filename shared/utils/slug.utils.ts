/**
 * Slug helpers for content whose title is not Latin: script titles are
 * Macedonian Cyrillic, and a generic slugify leaves them to percent-encode
 * into `%D0%B1%D0%B8%D0%BE…`, which is the opposite of a readable URL.
 *
 * Shared because both sides need the same answer: the API mints the slug when
 * a script is created, and the form previews it from the same function so the
 * preview cannot drift from what is stored.
 */

/**
 * Macedonian Cyrillic folded to ASCII, plus the Serbian, Russian and Ukrainian
 * letters that turn up in subject and professor names. Folded rather than
 * transliterated properly (`ж` is `ž`, but stored as `z`) because a slug has to
 * survive in a URL unescaped.
 *
 * Written as pairs, not as an object literal: the keys are Cyrillic, and an
 * identifier may not be. */
const CYRILLIC: ReadonlyMap<string, string> = new Map([
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['ѓ', 'gj'],
  ['е', 'e'],
  ['ж', 'z'],
  ['з', 'z'],
  ['ѕ', 'dz'],
  ['и', 'i'],
  ['ј', 'j'],
  ['к', 'k'],
  ['л', 'l'],
  ['љ', 'lj'],
  ['м', 'm'],
  ['н', 'n'],
  ['њ', 'nj'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['ќ', 'kj'],
  ['у', 'u'],
  ['ф', 'f'],
  ['х', 'h'],
  ['ц', 'c'],
  ['ч', 'c'],
  ['џ', 'dz'],
  ['ш', 's'],
])

/** `đ` is the one Latin letter with a stroke that NFKD does not decompose. */
const LATIN_EXCEPTIONS: ReadonlyMap<string, string> = new Map([['đ', 'dj']])

/** The title-derived part of a slug, so the whole thing stays readable in a
 * URL, a notification row and a shared link. */
export const SLUG_STEM_MAX_LENGTH = 60

/** Characters of the row id appended to keep slugs unique without a lookup. */
export const SLUG_ID_LENGTH = 8

/** Cyrillic (and accented Latin) folded to ASCII, everything else untouched. */
export const transliterateToAscii = (input: string): string =>
  Array.from(input.toLowerCase())
    .map((char) => CYRILLIC.get(char) ?? LATIN_EXCEPTIONS.get(char) ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

/**
 * The readable part of a slug: `биологија предавање 1` becomes
 * `biologija-predavanje-1`. Empty when the title has nothing to keep, which
 * the callers turn into a fallback rather than an empty slug.
 */
export const slugifyTitle = (title: string): string =>
  transliterateToAscii(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_STEM_MAX_LENGTH)
    .replace(/-+$/, '')

/**
 * The slug a script is stored with: its title plus the first characters of its
 * id, e.g. `biologija-predavanje-1-f585a670`. The suffix is what makes it
 * unique without checking the table, and it is stable because an id never
 * changes — which is why the slug is minted once, at creation.
 */
export const buildScriptSlug = (title: string, id: string): string => {
  const stem = slugifyTitle(title) || 'script'
  const suffix = id.replace(/-/g, '').slice(0, SLUG_ID_LENGTH)

  return `${stem}-${suffix}`
}

/** Ids are UUIDs and slugs never are, so a route can take either: a link
 * minted before slugs existed still resolves, and the page can redirect it to
 * the canonical form. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value)
