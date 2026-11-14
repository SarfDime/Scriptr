import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@shared/config/localization-constants'
import {
  defineField,
  defineType,
  type FieldDefinition,
  type ObjectDefinition,
  type Rule,
} from 'sanity'
import {
  createTranslateFieldWrapper,
  LocalizedObjectInput,
} from '../../components/TranslateFieldWrapper'
import type {
  LocalizedFieldOptions,
  LocalizedTypeConfig,
  LocalizedValueType,
} from '../../types/localization.types'
import { RichTextInput, RichTextLiteInput } from '../portable-text/portableText'

const createLocaleStringField = (
  language: SupportedLanguage
): FieldDefinition =>
  defineField({
    name: language.id,
    title: language.title,
    type: 'string',
    components: { field: createTranslateFieldWrapper(language) },
  })

const RICH_TEXT_INPUTS = {
  richText: RichTextInput,
  richTextLite: RichTextLiteInput,
} as const

const createLocaleRichTextField =
  (type: 'richText' | 'richTextLite') =>
  (language: SupportedLanguage): FieldDefinition =>
    defineField({
      name: language.id,
      title: language.title,
      type,
      // A field-level `components` object replaces the type's, so the custom
      // Portable Text input has to be passed along with the field wrapper.
      components: {
        input: RICH_TEXT_INPUTS[type],
        field: createTranslateFieldWrapper(language),
      },
    })

const createLocaleStringArrayField = (
  language: SupportedLanguage
): FieldDefinition =>
  defineField({
    name: language.id,
    title: language.title,
    type: 'array',
    of: [{ type: 'string' }],
    components: { field: createTranslateFieldWrapper(language) },
  })

/** Builds an object type with one field per supported language. */
const createLocalizedType = ({
  name,
  title,
  description,
  field,
}: LocalizedTypeConfig): ObjectDefinition =>
  defineType({
    name,
    title,
    description,
    type: 'object',
    components: { input: LocalizedObjectInput },
    fields: SUPPORTED_LANGUAGES.map((language) => field(language)),
  })

export const LocalizedString = createLocalizedType({
  name: 'localizedString',
  title: 'Localized string',
  description: 'A single line of text with one value per supported language.',
  field: createLocaleStringField,
})

export const LocalizedRichText = createLocalizedType({
  name: 'localizedRichText',
  title: 'Localized rich text',
  description: 'Rich text with one value per supported language.',
  field: createLocaleRichTextField('richText'),
})

export const LocalizedRichTextLite = createLocalizedType({
  name: 'localizedRichTextLite',
  title: 'Localized rich text (lite)',
  description: 'Compact rich text with one value per supported language.',
  field: createLocaleRichTextField('richTextLite'),
})

export const LocalizedStringArray = createLocalizedType({
  name: 'localizedStringArray',
  title: 'Localized string list',
  description: 'A list of strings with one list per supported language.',
  field: createLocaleStringArrayField,
})

const LOCALIZED_TYPE_NAMES: Record<LocalizedValueType, string> = {
  string: LocalizedString.name,
  richText: LocalizedRichText.name,
  richTextLite: LocalizedRichTextLite.name,
  stringArray: LocalizedStringArray.name,
}

const portableTextHasContent = (blocks: unknown): boolean => {
  if (!Array.isArray(blocks)) return false

  return blocks.some((block) => {
    if (typeof block !== 'object' || block === null) return false
    const { children } = block as { children?: unknown }
    if (!Array.isArray(children)) return false

    return children.some(
      (child: unknown) =>
        typeof child === 'object' &&
        child !== null &&
        typeof (child as { text?: unknown }).text === 'string' &&
        (child as { text: string }).text.trim().length > 0
    )
  })
}

/** Whether one language of a localized object holds something to show. */
const languageHasContent = (
  value: unknown,
  valueType: LocalizedValueType,
  language: string
): boolean => {
  const languageValue = (value as Record<string, unknown>)[language]

  if (valueType === 'richText' || valueType === 'richTextLite') {
    return portableTextHasContent(languageValue)
  }
  if (valueType === 'stringArray') {
    return Array.isArray(languageValue) && languageValue.length > 0
  }
  return typeof languageValue === 'string' && languageValue.trim().length > 0
}

/**
 * At least one language, not necessarily the default one: a document can be
 * authored only in Macedonian and still be publishable, and the frontend falls
 * back requested → default → any other filled language.
 */
const hasAnyLocaleContent = (
  value: unknown,
  valueType: LocalizedValueType
): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return SUPPORTED_LANGUAGES.some(({ id }) =>
    languageHasContent(value, valueType, id)
  )
}

/**
 * A field holding the same value in every supported language. The localized
 * object types above provide the per-language inputs and their fieldsets.
 */
export function localizedField({
  name,
  title,
  valueType,
  description,
  group,
  fieldset,
  isRequired = false,
}: LocalizedFieldOptions): FieldDefinition {
  return defineField({
    name,
    title,
    description,
    group,
    fieldset,
    type: LOCALIZED_TYPE_NAMES[valueType],
    validation: isRequired
      ? (rule: Rule) =>
          rule.custom((value) =>
            hasAnyLocaleContent(value, valueType)
              ? true
              : 'Add at least one language.'
          )
      : undefined,
  })
}
