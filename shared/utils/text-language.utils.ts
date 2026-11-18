import type { LocaleId } from '../config/localization-constants'

/**
 * Which writing systems authored text accepts, for as long as the project is
 * Macedonian-and-English only.
 *
 * It matters beyond copy: a script's URL is built from its title
 * (`slug.utils.ts` folds Cyrillic to ASCII), and every other script folds to
 * nothing, so a Greek or CJK title would silently land on a `script-<id>`
 * placeholder. Rejecting it at the form and at the API is clearer than
 * accepting text the rest of the app cannot represent.
 */
const UNSUPPORTED_LETTER = /(?![\p{Script=Latin}\p{Script=Cyrillic}])\p{L}/u

/** True when `text` contains a letter from a script other than Latin or
 * Cyrillic. Punctuation, digits and emoji are not letters, so they pass. */
export const hasUnsupportedScript = (text: string): boolean =>
  UNSUPPORTED_LETTER.test(text)

const LATIN_LETTER = /\p{Script=Latin}/u
const CYRILLIC_LETTER = /\p{Script=Cyrillic}/u
const ANY_LETTER = /\p{L}/gu

/** The one script each language's field takes. A locale added without an entry
 * fails the type check, so its field cannot silently accept both. */
const LOCALE_SCRIPT: Record<LocaleId, 'latin' | 'cyrillic'> = {
  en: 'latin',
  mk: 'cyrillic',
}

/** True when `text` holds a letter from the other language's writing system —
 * Cyrillic in an English field, Latin in a Macedonian one. */
export const hasWrongScriptForLocale = (
  text: string,
  locale: LocaleId
): boolean => {
  const wrongLetter =
    LOCALE_SCRIPT[locale] === 'latin' ? CYRILLIC_LETTER : LATIN_LETTER
  return wrongLetter.test(text)
}

/** Letters in `text`, across either supported script. Digits, punctuation and
 * emoji are not counted. */
export const countLetters = (text: string): number =>
  text.match(ANY_LETTER)?.length ?? 0
