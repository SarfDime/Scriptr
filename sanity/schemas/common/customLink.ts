import { defineField, type FieldDefinition } from 'sanity'
import { CustomLinkInput } from '../../components/CustomLinkInput'
import { validationRules } from '../validation'

type CustomLinkFieldOptions = {
  name?: string
  title?: string
  description?: string
  fieldset?: string
  required?: boolean
}

export const customLinkField = ({
  name = 'customLink',
  title = 'Custom link',
  description = 'Enter an internal path or an external HTTPS URL.',
  fieldset,
  required = true,
}: CustomLinkFieldOptions = {}): FieldDefinition =>
  defineField({
    name,
    title,
    description,
    type: 'string',
    fieldset,
    components: { field: CustomLinkInput },
    validation: required ? validationRules.urlValidation : undefined,
  })
