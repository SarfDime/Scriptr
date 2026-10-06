import { defineField, type FieldDefinition, type StringRule } from 'sanity'
import { CustomLinkInput } from '../../components/CustomLinkInput'
import type { GroupingKeys } from '../../types/schema-prop.types'
import { validationRules } from '../validation'

export type CustomLinkFieldOptions = {
  name?: string
  title?: string
  description?: string
  grouping?: GroupingKeys
  required?: boolean
  validation?: (rule: StringRule) => StringRule
}

export const customLinkField = ({
  name = 'customLink',
  title = 'Custom link',
  description = 'Enter an internal path or an external HTTPS URL.',
  grouping,
  required = true,
  validation,
}: CustomLinkFieldOptions = {}): FieldDefinition =>
  defineField({
    name,
    title,
    description,
    type: 'string',
    fieldset: grouping,
    group: grouping,
    components: { field: CustomLinkInput },
    validation: validation
      ? validation
      : (rule) => validationRules.urlValidation(rule, required),
  })
