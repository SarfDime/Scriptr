import { defineField, type FieldDefinition } from 'sanity'
import {
  imageValidation,
  stringValidation,
  validationRules,
} from '../validation'

type TitleAndDescription = {
  title?: string
  options?: Record<string, unknown>
  description?: string
  group?: string
  fieldset?: string
  type?: 'string' | 'richText' | 'richTextLite'
  isRequired?: boolean
}

type HeaderFieldsProps = {
  subtitle?: { showSubtitle?: boolean } & TitleAndDescription
  icon?: { showIcon?: boolean } & TitleAndDescription
} & TitleAndDescription

const createTextField = (
  baseName: 'title' | 'subtitle',
  config: TitleAndDescription
): FieldDefinition => {
  const { type = 'richText', isRequired, ...rest } = config
  const name =
    type === 'string'
      ? `string${baseName === 'title' ? 'Title' : 'Subtitle'}`
      : baseName

  return type === 'string'
    ? defineField({
        ...rest,
        name,
        type: 'string',
        validation: isRequired ? stringValidation : undefined,
      })
    : defineField({
        ...rest,
        name,
        type,
        validation: isRequired ? validationRules.isRequired : undefined,
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
      createTextField('title', {
        title,
        type,
        isRequired,
        ...rest,
      })
    )
  }

  if (subtitle?.showSubtitle) {
    headerInfo.push(
      createTextField('subtitle', {
        ...subtitle,
      })
    )
  }

  if (icon?.showIcon) {
    headerInfo.push(
      defineField({
        name: 'icon',
        title: icon?.title ?? 'Section icon',
        type: 'image',
        group: icon?.group,
        fieldset: icon?.fieldset,
        validation: icon?.isRequired ? imageValidation : undefined,
        description: icon?.description,
        options: { ...icon?.options, hotspot: true },
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
