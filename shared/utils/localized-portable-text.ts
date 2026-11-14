import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleId,
} from '../config/localization-constants'
import type { PortableTextValue } from '../types/portable-text.types'
import type { LocalizedScriptText } from '../types/scripts.types'
import {
  isPortableTextValue,
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextToPlainText,
} from './portable-text.utils'

/** A language holds something to show: Portable Text with actual text in it.
 *  An empty array, or blocks of nothing but whitespace, does not count. */
export const isFilledPortableText = (value: unknown): boolean =>
  isPortableTextValue(value) && portableTextToPlainText(value).trim().length > 0

/**
 * The languages a reader falls back through: their own, the default one, then
 * every other — the same order a Sanity projection resolves in, so a script and
 * a subject behave alike when a translation is missing.
 */
export const localeFallbackOrder = (locale: LocaleId): Array<LocaleId> => [
  locale,
  ...(locale === DEFAULT_LOCALE ? [] : [DEFAULT_LOCALE as LocaleId]),
  ...LOCALES.filter(
    (candidate) => candidate !== locale && candidate !== DEFAULT_LOCALE
  ),
]

/** The languages this value actually has text in. */
export const filledTextLanguages = (
  value: LocalizedScriptText | null | undefined
): Array<LocaleId> =>
  LOCALES.filter((locale) => isFilledPortableText(value?.[locale]))

/** The map with the languages that hold nothing dropped — what a form sends, so
 *  an untouched editor on the other language is "absent", not "empty". */
export const filledLocalizedText = (
  value: LocalizedScriptText
): LocalizedScriptText =>
  Object.fromEntries(
    filledTextLanguages(value).map((locale) => [locale, value[locale]])
  ) as LocalizedScriptText

/**
 * The text to render: the reader's language, else the default one, else any
 * other that is filled, else `null`. `null` means the field has nothing to
 * show in any language — not that this reader is missing it.
 */
export const pickLocalizedPortableText = (
  value: LocalizedScriptText | null | undefined,
  locale: LocaleId
): PortableTextValue | null => {
  for (const candidate of localeFallbackOrder(locale)) {
    const text = value?.[candidate]
    if (isFilledPortableText(text)) return text ?? null
  }

  return null
}

/** Every filled language, flattened into one searchable string: a script
 *  authored in Macedonian is found by a Macedonian query whoever is reading,
 *  which is what the reader sees it as anyway. */
export const localizedPortableTextSearchText = (
  value: LocalizedScriptText | null | undefined
): string =>
  filledTextLanguages(value)
    .map((locale) => portableTextToPlainText(value?.[locale]))
    .filter(Boolean)
    .join('\n')

const isLocalizedTextRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isLanguageKey = (key: string): key is LocaleId =>
  LOCALES.includes(key as LocaleId)

/**
 * The shape the API accepts for one script text field: an object keyed by
 * language, every language present valid on its own (the Portable Text rules
 * and byte limit a single value always had), and at least one of them filled.
 *
 * A bare Portable Text array — the pre-localization shape — is rejected rather
 * than guessed at, so a stale client cannot silently write a value no reader
 * resolves.
 */
const isLocalizedTextMap = (
  value: unknown,
  isValidEntry: (entry: unknown) => boolean
): value is LocalizedScriptText => {
  if (!isLocalizedTextRecord(value)) return false

  const entries = Object.entries(value)
  if (entries.length === 0) return false
  if (
    !entries.every(
      ([language, entry]) => isLanguageKey(language) && isValidEntry(entry)
    )
  ) {
    return false
  }

  return entries.some(([, entry]) => isFilledPortableText(entry))
}

/** A title in one or more languages: at least one filled, each within 2 KB. */
export const isLocalizedScriptTitle = (
  value: unknown
): value is LocalizedScriptText =>
  isLocalizedTextMap(value, isScriptTitlePortableTextValue)

/** A description in one or more languages: at least one filled, each within
 *  50 KB. */
export const isLocalizedScriptDescription = (
  value: unknown
): value is LocalizedScriptText =>
  isLocalizedTextMap(value, isScriptDescriptionPortableTextValue)
