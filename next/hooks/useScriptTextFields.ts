'use client'

import {
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleId,
} from '@shared/config/localization-constants'
import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { LocalizedScriptText } from '@shared/types/scripts.types'
import {
  filledLocalizedText,
  filledTextLanguages,
  isLocalizedScriptDescription,
  isLocalizedScriptTitle,
} from '@shared/utils/localized-portable-text'
import {
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import {
  countLetters,
  hasUnsupportedScript,
  hasWrongScriptForLocale,
} from '@shared/utils/text-language.utils'
import { useState } from 'react'

/** The two rich-text fields a script form edits. */
export type ScriptTextField = 'title' | 'description'

/** Initial values, per language: what the author stored. */
export type ScriptTextValues = {
  title: LocalizedScriptText
  description: LocalizedScriptText
}

const EMPTY: PortableTextValue = []

/** A title's own rules for one language. Its Portable Text shape and byte limit
 * are checked over the whole map by `isLocalizedScriptTitle`. */
const titleContentValid = (
  value: PortableTextValue,
  locale: LocaleId
): boolean => {
  const text = portableTextToPlainText(value)
  return (
    countLetters(text) >= PORTABLE_TEXT_LIMITS.scriptTitleMinimumLetters &&
    !hasUnsupportedScript(text) &&
    !hasWrongScriptForLocale(text, locale)
  )
}

const descriptionContentValid = (
  value: PortableTextValue,
  locale: LocaleId
): boolean => {
  const text = portableTextToPlainText(value)
  return !hasUnsupportedScript(text) && !hasWrongScriptForLocale(text, locale)
}

/**
 * Title/description state for both script forms, one language at a time.
 *
 * The author edits a single language at a time — a language selector in
 * `ScriptDetailsFields` chooses which — and the form keeps every language it
 * was given, so switching back and forth never loses work. An untouched
 * language is dropped before the payload is built (`filledLocalizedText`), and
 * the rules the API enforces are mirrored here: **at least one** language for
 * the title, a valid description whenever one is written, each within its byte
 * limit and in a supported script, every title carrying at least
 * `PORTABLE_TEXT_LIMITS.scriptTitleMinimumLetters` letters, and every field
 * using the writing system of its language. A description is never required.
 *
 * The editors themselves are uncontrolled, so a reset is applied by remounting
 * them (see `ScriptDetailsFields`' `resetKey`) rather than by this hook.
 */
export function useScriptTextFields({
  title: initialTitle,
  description: initialDescription,
}: ScriptTextValues) {
  const [titles, setTitles] = useState<LocalizedScriptText>(initialTitle)
  const [descriptions, setDescriptions] =
    useState<LocalizedScriptText>(initialDescription)
  // Opens on a language that already has text, so an edit starts where the
  // author left off rather than on an empty English tab.
  const [language, setLanguage] = useState<LocaleId>(
    () => filledTextLanguages(initialTitle)[0] ?? DEFAULT_LOCALE
  )
  const [touched, setTouched] = useState<ReadonlySet<ScriptTextField>>(
    () => new Set()
  )

  const markTouched = (field: ScriptTextField) =>
    setTouched((current) =>
      current.has(field) ? current : new Set(current).add(field)
    )

  const title = titles[language] ?? EMPTY
  const description = descriptions[language] ?? EMPTY

  const titleText = portableTextToPlainText(title)
  const descriptionText = portableTextToPlainText(description)

  const titleFilledLanguages = filledTextLanguages(titles)
  const descriptionFilledLanguages = filledTextLanguages(descriptions)

  const titleHasContent = titleFilledLanguages.length > 0
  const descriptionHasContent = descriptionFilledLanguages.length > 0

  // Per-language problems are reported on the language being edited.
  const titleTooLong =
    portableTextJsonByteLength(title) > PORTABLE_TEXT_LIMITS.scriptTitleBytes
  // An empty tab is not short: another language may already hold the title.
  const titleTooShort =
    titleFilledLanguages.includes(language) &&
    countLetters(titleText) < PORTABLE_TEXT_LIMITS.scriptTitleMinimumLetters
  const titleUnsupportedScript = hasUnsupportedScript(titleText)
  const titleWrongScript = hasWrongScriptForLocale(titleText, language)
  const descriptionTooLong =
    portableTextJsonByteLength(description) >
    PORTABLE_TEXT_LIMITS.scriptDescriptionBytes
  const descriptionUnsupportedScript = hasUnsupportedScript(descriptionText)
  const descriptionWrongScript = hasWrongScriptForLocale(
    descriptionText,
    language
  )

  // Every filled language is checked, so a clean tab cannot hide a bad one.
  const titleValid =
    isLocalizedScriptTitle(filledLocalizedText(titles)) &&
    titleFilledLanguages.every((locale) =>
      titleContentValid(titles[locale] ?? EMPTY, locale)
    )
  // Optional: an empty description is valid, one that is written has to be.
  const descriptionValid =
    !descriptionHasContent ||
    (isLocalizedScriptDescription(filledLocalizedText(descriptions)) &&
      descriptionFilledLanguages.every((locale) =>
        descriptionContentValid(descriptions[locale] ?? EMPTY, locale)
      ))

  return {
    language,
    changeLanguage: setLanguage,
    title,
    description,
    /** Which languages the title is filled in, for the selector. */
    titleFilledLanguages,
    changeTitle: (value: PortableTextValue) => {
      markTouched('title')
      setTitles((current) => ({ ...current, [language]: value }))
    },
    changeDescription: (value: PortableTextValue) => {
      markTouched('description')
      setDescriptions((current) => ({ ...current, [language]: value }))
    },
    titleHasContent,
    descriptionHasContent,
    titleTooLong,
    titleTooShort,
    descriptionTooLong,
    titleUnsupportedScript,
    titleWrongScript,
    descriptionUnsupportedScript,
    descriptionWrongScript,
    /** The title holds what the API accepts in at least one language, and a
     * description, if one is written, does too. */
    isValid: titleValid && descriptionValid,
    /** The map to send: empty languages dropped. */
    titlePayload: filledLocalizedText(titles),
    descriptionPayload: descriptionHasContent
      ? filledLocalizedText(descriptions)
      : null,
    titleValid,
    titleInvalid:
      touched.has('title') &&
      (!titleHasContent ||
        titleTooShort ||
        titleTooLong ||
        titleUnsupportedScript ||
        titleWrongScript),
    descriptionInvalid:
      touched.has('description') &&
      (descriptionTooLong ||
        descriptionUnsupportedScript ||
        descriptionWrongScript),
    touchAll: () => {
      setTouched(new Set<ScriptTextField>(['title', 'description']))
      // Point at the offending language rather than only blocking the submit:
      // the editors show one language at a time.
      const invalid = LOCALES.find(
        (locale) =>
          (titleFilledLanguages.includes(locale) &&
            !titleContentValid(titles[locale] ?? EMPTY, locale)) ||
          (descriptionFilledLanguages.includes(locale) &&
            !descriptionContentValid(descriptions[locale] ?? EMPTY, locale))
      )
      if (invalid !== undefined && invalid !== language) setLanguage(invalid)
    },
    reset: (next: ScriptTextValues) => {
      setTitles(next.title)
      setDescriptions(next.description)
      setLanguage(filledTextLanguages(next.title)[0] ?? DEFAULT_LOCALE)
      setTouched(new Set())
    },
  }
}

export type UseScriptTextFieldsReturn = ReturnType<typeof useScriptTextFields>
