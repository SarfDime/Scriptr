import { defineType } from 'sanity'
import { allSectionTypes } from '../../structure-tool/sections-structure'
import { slugSchemaField } from '../common/slug'
import { filterExistingReferences } from '../util-functions/schemaFilters'
import { createSectionPreview } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'
import { SEOPageData } from './SEOPageData'

export const Page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  preview: createSectionPreview({
    sectionImage: 'seoImage',
    subtitle: 'pageSlug.current',
  }),

  groups: [
    {
      name: 'seoData',
      title: 'SEO Data',
    },
    {
      name: 'slug',
      title: 'Page Slug',
    },
  ],
  fieldsets: [
    {
      name: 'seoData',
      title: 'Page SEO',
      description: 'SEO data for the page',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    ...SEOPageData(false),

    slugSchemaField({
      name: 'pageSlug',
      title: 'Page slug',
      description: 'A URL-friendly version of the SEO title for the page.',
      group: 'slug',
      isRequired: false,
    }),

    {
      type: 'array',
      name: 'pageSections',
      title: 'Sections',
      description: 'The different sections that appear on the page.',
      validation: validationRules.isRequired,
      of: [
        {
          type: 'reference',
          title: 'Select a section from the list',
          options: {
            filter: filterExistingReferences,
          },
          to: allSectionTypes,
        },
      ],
    },
  ],
})
