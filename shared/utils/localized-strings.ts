import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleId,
} from '../config/localization-constants'
import type {
  LocalizedMessage,
  ResolvedStrings,
} from '../types/localization.types'

const isLocaleId = (key: string): key is LocaleId =>
  LOCALES.includes(key as LocaleId)

/**
 * A `{ en, mk }` entry: at least one supported language, every key a language,
 * every value a string. Anything else is an ordinary nested object.
 */
const isLocalizedText = (
  value: unknown
): value is Partial<Record<LocaleId, string>> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const entries = Object.entries(value)
  return (
    entries.length > 0 &&
    entries.every(
      ([key, entry]) => isLocaleId(key) && typeof entry === 'string'
    )
  )
}

/** An entry that may be missing a language, as data from outside the typed
 * collections can be — `getStrings` resolves the same partial shape. */
type PartialLocalizedText = Partial<Record<LocaleId, string>>

/** `1 предмет`, `21 предмет`, `3 предмети`: Macedonian keeps the singular after
 * a number ending in 1, except 11 and 111. */
export const mkCount = (value: number, one: string, many: string): string =>
  `${value} ${value % 10 === 1 && value % 100 !== 11 ? one : many}`

/** The first language that holds text, in `LOCALES` order (the default one
 *  first). For the places that keep a single string — a Postgres row's `name`,
 *  a slug stem, a Studio preview — rather than a language pick. */
export const firstFilledLocalizedText = (value: unknown): string => {
  if (typeof value !== 'object' || value === null) return ''
  const record = value as Record<string, unknown>
  for (const locale of LOCALES) {
    const entry = record[locale]
    if (typeof entry === 'string' && entry.trim().length > 0) return entry
  }
  return ''
}

/**
 * One `{ en, mk }` entry — or a plain string — in one language. The counterpart
 * of `getStrings` for a single value: components that take one piece of copy (a
 * page header) can resolve it themselves instead of the page resolving the
 * whole collection to pass one string down. A missing language falls back the
 * way a collection does: requested → default → empty.
 */
export const resolveLocalizedText = (
  message: LocalizedMessage | PartialLocalizedText,
  locale: LocaleId
): string =>
  typeof message === 'string'
    ? message
    : (message[locale] ?? message[DEFAULT_LOCALE] ?? '')

const resolveValue = (value: unknown, locale: LocaleId): unknown => {
  if (typeof value === 'function') {
    const message = value as (...args: Array<never>) => unknown
    return (...args: Array<never>) => resolveValue(message(...args), locale)
  }
  if (typeof value !== 'object' || value === null) return value
  if (Array.isArray(value)) {
    return value.map((entry) => resolveValue(entry, locale))
  }
  if (isLocalizedText(value)) {
    return value[locale] ?? value[DEFAULT_LOCALE] ?? ''
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      resolveValue(entry, locale),
    ])
  )
}

const resolved = new WeakMap<object, Map<LocaleId, unknown>>()

/**
 * A string collection with every `{ en, mk }` entry replaced by `locale`.
 * Collections are module-level constants, so the result is memoised per
 * collection and language and the same object comes back every time — a hook
 * can return it without rebuilding anything.
 */
export const getStrings = <T extends object>(
  strings: T,
  locale: LocaleId
): ResolvedStrings<T> => {
  let byLocale = resolved.get(strings)
  if (!byLocale) {
    byLocale = new Map()
    resolved.set(strings, byLocale)
  }

  const cached = byLocale.get(locale)
  if (cached !== undefined) return cached as ResolvedStrings<T>

  const value = resolveValue(strings, locale) as ResolvedStrings<T>
  byLocale.set(locale, value)
  return value
}

/** Uncached {@link getStrings}, for a one-off object rather than a module-level
 * collection. Prefer `getStrings`: it keeps the identity stable. */
export const resolveStrings = <T extends object>(
  strings: T,
  locale: LocaleId
): ResolvedStrings<T> => resolveValue(strings, locale) as ResolvedStrings<T>

/**
 * The text at a dot path in a collection already resolved for a language, with
 * the arguments a message function needs. `null` when the path does not end in
 * text — a typo the path type should have caught.
 */
export const getMessage = (
  strings: unknown,
  path: string,
  args: ReadonlyArray<string | number> = []
): string | null => {
  const message = path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)[key]
          : undefined,
      strings
    )

  const text =
    typeof message === 'function'
      ? (message as (...values: Array<string | number>) => unknown)(...args)
      : message

  return typeof text === 'string' ? text : null
}

let activeLocale: LocaleId = DEFAULT_LOCALE

/**
 * The language client code is currently reading in, for helpers that cannot
 * call a hook — a validator, a mapper. Read it while handling an event, never
 * during render: nothing re-renders when it changes.
 *
 * Server code must pass the locale explicitly to `getStrings` instead; this
 * value is per process, so one request would otherwise read another's choice.
 */
export const getActiveLocale = (): LocaleId => activeLocale

/** Kept current by `LocaleProvider`. */
export const setActiveLocale = (locale: LocaleId): void => {
  activeLocale = locale
}
