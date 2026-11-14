import { defineField, type FieldDefinition } from 'sanity'
import { imageValidation } from '../validation'
import { localizedField } from './localeFields'

type TextFieldType = 'string' | 'richText' | 'richTextLite'

type TitleAndDescription = {
  title?: string
  /** Image options for `icon`; a localized text field takes none. */
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
 * One header text field, in every language. A document carries `localizedTitle`
 * (and `localizedSubtitle` when the schema asks for one), so the renderer picks
 * the reader's language and a Studio editor fills one at a time.
 */
const headerTextField = (
  baseName: 'title' | 'subtitle',
  { title, type = 'richText', isRequired, ...rest }: TitleAndDescription
): FieldDefinition => {
  const suffix = baseName === 'title' ? 'Title' : 'Subtitle'

  return localizedField({
    name: `localized${suffix}`,
    title:
      title ?? (baseName === 'title' ? 'Section title' : 'Section subtitle'),
    valueType: type,
    description: rest.description,
    group: rest.group,
    fieldset: rest.fieldset,
    isRequired,
  })
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
      headerTextField('title', { title, type, isRequired, ...rest })
    )
  }

  if (subtitle?.showSubtitle) {
    headerInfo.push(
      headerTextField('subtitle', {
        title: subtitle.title,
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
