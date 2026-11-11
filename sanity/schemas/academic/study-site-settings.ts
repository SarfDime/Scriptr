import { defineField, defineType } from 'sanity'

/**
 * The study site's own settings. A named type rather than an object inline in
 * `study` because GraphQL cannot express an anonymous object: the extractor
 * needs a top-level type to give the field. The Studio and the stored shape are
 * unchanged — an object field keeps its fields wherever they are declared.
 */
export const StudySiteSettings = defineType({
  name: 'studySiteSettings',
  title: 'Study site settings',
  type: 'object',
  fields: [
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'navigation',
      title: 'Navigation menu',
      type: 'reference',
      to: [{ type: 'navMenu' }],
      description: 'Leave empty to use the global navigation menu.',
    }),
  ],
})
