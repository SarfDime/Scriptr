import type { SupportedLanguage } from '@shared/config/localization-constants'
import type { FieldDefinition } from 'sanity'

/** Primitive field shapes that can be localized. */
type LocalizedValueType = 'string' | 'richText' | 'richTextLite' | 'stringArray'

type LocalizedFieldOptions = {
  name: string
  title: string
  valueType: LocalizedValueType
  description?: string
  group?: string
  fieldset?: string
  isRequired?: boolean
}

type LocalizedTypeConfig = {
  name: string
  title: string
  description: string
  field: (language: SupportedLanguage) => FieldDefinition
}

export type { LocalizedFieldOptions, LocalizedTypeConfig, LocalizedValueType }
