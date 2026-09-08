import { defineType } from 'sanity'
import { FieldsetWithClass } from '../components/FieldsetWithClass'
import { filterExistingReferences } from './util-functions/schemaFilters'
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
    name: 'navMenu',
    title: 'Nav on website',
    fieldset: 'navAndFooter',
    options: {
      disableNew: true,
    },
    validation: validationRules.isRequired,
    to: [{ type: 'navMenu' }],
  },

  // {
  //   type: 'reference',
  //   name: 'footer',
  //   title: 'Footer on website',
  //   fieldset: 'navAndFooter',
  //   validation: validationRules.isRequired,
  //   options: {
  //     disableNew: true,
  //   },
  //   to: [{ type: 'footer' }],
  // },

  {
    name: 'pagesFields',
    type: 'string',
    fieldset: 'pages',
    components: {
      field: FieldsetWithClass,
    },
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
          filter: filterExistingReferences,
          disableNew: true,
        },
        to: [{ type: 'page' }],
      },
    ],
  },

  {
    type: 'array',
    name: 'universities',
    title: 'Universities',
    group: 'websitePagesMenu',
    fieldset: 'pages',
    description: 'Universities that will be added to the website.',
    of: [
      {
        type: 'reference',
        options: {
          filter: filterExistingReferences,
          disableNew: true,
        },
        to: [{ type: 'university' }],
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
    {
      title: 'Site name',
      name: 'siteName',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'The brand name used in SEO titles and social metadata.',
    },
    {
      title: 'Site URL',
      name: 'siteUrl',
      type: 'url',
      group: 'websiteTitleMenu',
      description:
        'Canonical public URL for the website, e.g. https://example.com',
    },
    {
      title: 'Default SEO title',
      name: 'defaultSeoTitle',
      type: 'string',
      group: 'websiteTitleMenu',
      description: 'Fallback title used when a page does not specify one.',
    },
    {
      title: 'Default SEO description',
      name: 'defaultSeoDescription',
      type: 'text',
      rows: 3,
      group: 'websiteTitleMenu',
      description:
        'Fallback description used in metadata for pages without their own copy.',
    },
    {
      title: 'Default SEO keywords',
      name: 'defaultKeywords',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'websiteTitleMenu',
      description:
        'Default keywords to append to page metadata when no page-specific keywords are set.',
    },

    ...WebsiteContent,
  ],
})
