export const PORTABLE_TEXT_LIMITS = {
  scriptTitleBytes: 2 * 1024,
  /** Letters a script title needs before the form accepts it. */
  scriptTitleMinimumLetters: 5,
  scriptDescriptionBytes: 50 * 1024,
  commentMinimumCharacters: 3,
  commentMaximumBytes: 10 * 1024,
} as const
