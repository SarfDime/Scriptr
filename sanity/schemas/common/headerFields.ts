import { defineField, type FieldDefinition } from 'sanity'
import {
  imageValidation,
  stringValidation,
  validationRules,
} from '../validation'
import { localizedField } from './localeFields'

type TextFieldType = 'string' | 'richText' | 'richTextLite'

type TitleAndDescription = {
  title?: string
  options?: Record<string, unknown>
  description?: string
  group?: string
  fieldset?: string
  type?: TextFieldType
  isRequired?: boolean
}

type HeaderFieldsProps = {
  subtitle?: { showSubtitle?: boolean } & TitleAndDescription
  icon?: { showIcon?: boolean } & TitleAndDescription
} & TitleAndDescription

/**
 * Creates the legacy single-language text field next to a localized duplicate.
 * The legacy field stays until the frontend reads localized values, so both are
 * edited side by side in the meantime.
 */
const createTextFieldPair = (
  baseName: 'title' | 'subtitle',
  { title, type = 'richText', isRequired, ...rest }: TitleAndDescription
): Array<FieldDefinition> => {
  const suffix = baseName === 'title' ? 'Title' : 'Subtitle'
  const fieldTitle =
    title ?? (baseName === 'title' ? 'Section title' : 'Section subtitle')
  const name = type === 'string' ? `string${suffix}` : baseName

  const legacyField =
    type === 'string'
      ? defineField({
          ...rest,
          title: fieldTitle,
          name,
          type: 'string',
          validation: isRequired ? stringValidation : undefined,
        })
      : defineField({
          ...rest,
          title: fieldTitle,
          name,
          type,
          validation: isRequired ? validationRules.isRequired : undefined,
        })

  return [
    legacyField,
    localizedField({
      name: `localized${suffix}`,
      title: `${fieldTitle} (localized)`,
      valueType: type,
      description: rest.description,
      group: rest.group,
      fieldset: rest.fieldset,
      isRequired,
    }),
  ]
}

export function headerSchemaFields({
  title = 'Section title',
  type = 'richText',
  isRequired = false,
  subtitle,
  icon,
  ...rest
}: HeaderFieldsProps): Array<FieldDefinition> {
  const headerInfo: Array<FieldDefinition> = []

  if (title) {
    headerInfo.push(
      ...createTextFieldPair('title', { title, type, isRequired, ...rest })
    )
  }

  if (subtitle?.showSubtitle) {
    headerInfo.push(
      ...createTextFieldPair('subtitle', {
        title: subtitle.title,
        options: subtitle.options,
        description: subtitle.description,
        group: subtitle.group,
        fieldset: subtitle.fieldset,
        type: subtitle.type,
        isRequired: subtitle.isRequired,
      })
    )
  }

  if (icon?.showIcon) {
    headerInfo.push(
      defineField({
        name: 'icon',
        title: icon.title ?? 'Section icon',
        type: 'image',
        group: icon.group,
        fieldset: icon.fieldset,
        description: icon.description,
        options: { ...icon.options, hotspot: true },
        validation: icon.isRequired ? imageValidation : undefined,
      })
    )
  }

  return headerInfo
}

export const internalUseTitle = defineField({
  name: 'title',
  title: 'Internal Title',
  type: 'string',
  description: 'Title used internally for sanity (not visible to end users).',
})
