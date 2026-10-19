const MAX_STORED_FILE_NAME_LENGTH = 80
const STORED_FILE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Turns an uploaded file's name into the form we store and show: extension
 * dropped (the file type is shown as its own badge), lowercased, accents
 * stripped, and everything that isn't a letter or digit collapsed into single
 * hyphens, so `Predavanje 3 – Šuma_final.PDF` becomes `predavanje-3-suma-final`.
 *
 * Returns `null` when nothing usable is left (a name made only of Cyrillic or
 * symbols, say), so the UI falls back to its positional label instead of
 * showing an empty name.
 */
export const toStoredFileName = (originalName: string): string | null => {
  const baseName = originalName.split(/[\\/]/).pop() ?? ''
  const extensionStart = baseName.lastIndexOf('.')
  const stem = extensionStart > 0 ? baseName.slice(0, extensionStart) : baseName

  const kebab = stem
    .toLowerCase()
    // Letters NFKD can't split into a base letter plus an accent.
    .replace(/đ/g, 'dj')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/þ/g, 'th')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_STORED_FILE_NAME_LENGTH)
    .replace(/-+$/g, '')

  return kebab.length > 0 ? kebab : null
}

/** The shape `toStoredFileName` produces. The API checks it on every file it
 * is handed, so a client can't store an arbitrary name. */
export const isStoredFileName = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= MAX_STORED_FILE_NAME_LENGTH &&
  STORED_FILE_NAME_PATTERN.test(value)
