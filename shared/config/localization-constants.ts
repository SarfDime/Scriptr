export const ENGLISH_LOCALE = 'en'
export const MACEDONIAN_LOCALE = 'mk'

export const LOCALES = [ENGLISH_LOCALE, MACEDONIAN_LOCALE] as const

export type LocaleId = (typeof LOCALES)[number]

/** `title` is the language's short code, used for the Studio's field labels;
 * `nativeTitle` is the same code for the reader-facing switch, where it sits
 * beside the language's flag (`LANGUAGE_FLAGS`). */
export const SUPPORTED_LANGUAGES = [
  {
    id: ENGLISH_LOCALE,
    title: 'EN',
    nativeTitle: 'EN',
    isDefault: true,
  },
  {
    id: MACEDONIAN_LOCALE,
    title: 'MKD',
    nativeTitle: 'MKD',
    isDefault: false,
  },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export type SupportedLanguageId = SupportedLanguage['id']
export type SupportedLanguageTitle = SupportedLanguage['title']

export const DEFAULT_LOCALE = ENGLISH_LOCALE

export type DefaultLocaleId = typeof DEFAULT_LOCALE

/** Every language that is edited as a translation of {@link DEFAULT_LOCALE}. */
export type TargetLanguageId = Exclude<SupportedLanguageId, DefaultLocaleId>
export type TargetLanguage = Extract<
  SupportedLanguage,
  { id: TargetLanguageId }
>

export const BASE_LANGUAGE = SUPPORTED_LANGUAGES[0]

export const DEFAULT_LANGUAGE: SupportedLanguage =
  SUPPORTED_LANGUAGES.find(({ isDefault }) => isDefault) ?? BASE_LANGUAGE
