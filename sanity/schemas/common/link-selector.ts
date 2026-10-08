import { defineField } from 'sanity'
import { sectionSchemas } from '../../structure-tool/sections-structure'
import type { FilterParams } from '../../types/schema-prop.types'
import { filterPageSections } from '../util-functions/schemaFilters'
import { validationRules } from '../validation'
import { customLinkField } from './customLink'

// Custom link selector with two options: internal or custom
// If internal, a reference to a page and section can be set/
// If custom, a slug or a full URL to an external website can be set
export const linkSelector = [
  defineField({
    name: 'linkType',
    title: 'Link type',
    description:
      'Choose whether the item should direct to a page or section within the site, or to a custom slug or external URL.',
    type: 'string',
    options: {
      list: [
        { title: 'Internal', value: 'internal' },
        { title: 'Custom', value: 'custom' },
      ],
      layout: 'radio',
      direction: 'horizontal',
    },
    initialValue: 'internal',
  }),
  defineField({
    name: 'page',
    title: 'Select a page',
    description:
      'Select a reference to an existing page or create a new page on the website. The item link will direct users to this page.',
    type: 'reference',
    to: [{ type: 'page' }],
    hidden: ({ document }) => document?.linkType === 'custom',
    validation: validationRules.linkSelectorInternalFieldsValidation as never,

    // Deferred: dynamically list pages and academic entities here.
    // (possibly hardcode the main pages?),
    // possibly fetch from university all the way down to the specific page?
    // probably best to hardcode and then fetch individually
  }),
  defineField({
    name: 'section',
    title: `Select a section from the chosen page in the 'Select a page' field above (OPTIONAL)`,
    description:
      'Select a reference to an existing section or create a new section on the website. The item link will direct users to this section. You must select a page first.',
    type: 'reference',
    to: sectionSchemas
      .map((section) => {
        return { type: section.schemaType }
      })
      .concat([
        {
          type: 'footer',
        },
      ]),
    hidden: ({ document }) => document?.linkType === 'custom',
    readOnly: ({ document }) => {
      const values = document as
        | { page?: { _ref?: string }; section?: { _ref?: string } }
        | undefined
      return (
        values?.page?._ref === undefined && values?.section?._ref === undefined
      )
    },
    options: {
      filter: async (params) =>
        filterPageSections(params as unknown as FilterParams),
    },
    validation: validationRules.linkSelectorInternalFieldsValidation as never,
  }),
  defineField({
    ...customLinkField({
      description:
        'Enter a slug or a URL to an external website (e.g. "https://google.com").',
      required: false,
    }),
    hidden: ({ document }) => document?.linkType !== 'custom',
    validation: validationRules.linkSelectorCustomLinkValidation as never,
  }),
]
