import { defineField, type SlugRule } from 'sanity'
import { slugifyString } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'

type SlugProps = {
  title?: string
  name?: string
  description?: string
  source?: string
  isRequired?: boolean
  group?: string
  fieldset?: string
}

/** A slug field whose value is generated from `source`, or from the document
 * title when no source is given. */
export function slugSchemaField({
  title,
  name,
  description,
  source,
  isRequired,
  group,
  fieldset,
}: SlugProps) {
  return defineField({
    title: title ?? 'Section Path',
    name: name ?? 'slug',
    type: 'slug',
    group,
    fieldset,
    description:
      description ??
      'A URL-friendly version of the section title used to create a link to the section',
    options: {
      source: source ?? 'title',
      slugify: slugifyString as unknown as (input: string) => string,
    },
    validation: (rule: SlugRule) =>
      validationRules.slugValidation(rule, isRequired),
  })
}
