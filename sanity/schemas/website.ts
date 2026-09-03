import { defineType } from 'sanity'
import { FieldsetWithClass } from '../components/FieldsetWithClass'
import { createExcludeSchemaFilter } from './util-functions/schemaFilters'
import { validationRules } from './validation'

const WebsiteContent = [
  {
    name: 'navAndFooterFields',
    type: 'string',
    fieldset: 'navAndFooter',
    components: {
      field: FieldsetWithClass,
    },
  },

  {
    type: 'reference',
    name: 'navigationMenu',
    title: 'Nav on website',
    fieldset: 'navAndFooter',
    options: {
      disableNew: true,
    },
    validation: validationRules.isRequired,
    to: [{ type: 'navigationMenu' }],
  },

  {
    type: 'reference',
    name: 'footer',
    title: 'Footer on website',
    fieldset: 'navAndFooter',
    validation: validationRules.isRequired,
    options: {
      disableNew: true,
    },
    to: [{ type: 'footer' }],
  },

  {
    name: 'pagesFields',
    type: 'string',
    fieldset: 'pages',
    components: {
      field: FieldsetWithClass,
    },
  },

  {
    type: 'reference',
    name: 'homepage',
    title: 'Homepage',
    fieldset: 'pages',
    options: {
      filter: createExcludeSchemaFilter({
        inputFieldName: 'page',
        otherFieldNames: ['pagesOnWebsite'],
      }),
      disableNew: true,
    },
    validation: validationRules.isRequired,
    to: [{ type: 'page' }],
  },

  {
    type: 'array',
    name: 'pagesOnWebsite',
    title: 'Pages on Website',
    group: 'websitePagesMenu',
    fieldset: 'pages',
    description: 'Pages that will be added to the website.',
    of: [
      {
        type: 'reference',
        options: {
          filter: createExcludeSchemaFilter({
            inputFieldName: 'page',
            singleFieldName: 'homepage',
          }),
          disableNew: true,
        },
        to: [{ type: 'page' }],
      },
    ],
  },
]

export const Website = defineType({
  name: 'website',
  title: 'Website',
  type: 'document',
  groups: [
    {
      name: 'websiteTitleMenu',
      title: 'Website title',
    },
    {
      name: 'websitePagesMenu',
      title: 'Pages',
    },
  ],
  fieldsets: [
    {
      name: 'pages',
      options: { collapsible: false, collapsed: false },
    },
    {
      name: 'navAndFooter',
      options: { collapsible: false, collapsed: false },
    },
  ],
  fields: [
    {
      title: 'Website title',
      name: 'websiteTitle',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'The title of the website.',
    },

    ...WebsiteContent,
  ],
})
