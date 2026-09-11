import type { SlugSourceContext } from '@sanity/types'
import { defineField, type FieldDefinition, type SanityDocument } from 'sanity'
import { sanitizeSlug } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'

type AcademicFieldOptions = {
  fieldset?: string
}

export const academicNameField = ({
  fieldset,
}: AcademicFieldOptions = {}): FieldDefinition =>
  defineField({
    name: 'name',
    title: 'Name',
    type: 'string',
    validation: (rule) => rule.required(),
    fieldset,
  })

export const academicDescriptionField = ({
  fieldset,
  required = false,
}: AcademicFieldOptions & { required?: boolean } = {}): FieldDefinition =>
  defineField({
    name: 'description',
    title: 'Description',
    type: 'richTextLite',
    fieldset,
    validation: required
      ? (rule) => validationRules.descriptionValidation(rule)
      : undefined,
  })

export const databaseIdField = ({
  fieldset,
}: AcademicFieldOptions = {}): FieldDefinition =>
  defineField({
    name: 'dbId',
    title: 'Database ID',
    type: 'string',
    readOnly: true,
    description:
      'Set by the "Create in Database" action. Publishing is blocked until this exists.',
    validation: (rule) =>
      rule.custom((value: string | undefined) =>
        value ? true : 'Run the "Create in Database" action before publishing.'
      ),
    fieldset,
  })

type AcademicSlugOptions = {
  hierarchy?: 'faculty' | 'study' | 'subject'
}

const hierarchyQuery = {
  faculty: '*[_id == $id][0]{name, university-> {name}}',
  study: '*[_id == $id][0]{name, faculty-> {name, university-> {name}}}',
  subject:
    '*[_id == $id][0]{name, study-> {name, faculty-> {name, university-> {name}}}}',
} as const

const hierarchySlugSource =
  (hierarchy: keyof typeof hierarchyQuery) =>
  async (document: SanityDocument, context: SlugSourceContext) => {
    const reference = document[
      hierarchy === 'faculty' ? 'university' : 'study'
    ] as { _ref?: string } | undefined
    if (!reference?._ref) return String(document.name ?? '')

    const parent = await context
      .getClient({ apiVersion: '2024-01-01' })
      .fetch(hierarchyQuery[hierarchy], { id: reference._ref })

    let parts: Array<string | undefined>
    if (hierarchy === 'faculty') {
      parts = [parent?.university?.name, document.name]
    } else if (hierarchy === 'study') {
      parts = [
        parent?.faculty?.university?.name,
        parent?.faculty?.name,
        document.name,
      ]
    } else {
      parts = [
        parent?.study?.faculty?.university?.name,
        parent?.study?.faculty?.name,
        parent?.study?.name,
        document.name,
      ]
    }

    return parts.filter(Boolean).map(sanitizeSlug).filter(Boolean).join('-')
  }

export const academicSlugField = ({
  hierarchy,
}: AcademicSlugOptions = {}): FieldDefinition =>
  defineField({
    name: 'slug',
    title: 'URL Slug',
    type: 'slug',
    options: {
      source: hierarchy ? hierarchySlugSource(hierarchy) : 'name',
      slugify: (value) => sanitizeSlug(value),
    },
    validation: (rule) => rule.required(),
  })
