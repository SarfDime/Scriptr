import type { Rule } from 'sanity'

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

/** This function returns a schema object for a slug field that can be used to
 * create a link to a section. The slug is automatically generated from the
 * section title or a custom source field.
 */
export function slugSchemaField({
  title,
  name,
  description,
  source,
  isRequired,
  group,
  fieldset,
}: SlugProps) {
  return {
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
      slugify: slugifyString,
    },
    validation: (rule: Rule) =>
      validationRules.slugValidation(rule, isRequired),
  }
}
