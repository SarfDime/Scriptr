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
