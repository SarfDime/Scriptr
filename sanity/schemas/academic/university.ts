import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import {
  academicDescriptionField,
  academicNameField,
  academicSlugField,
  databaseIdField,
} from '../common/academicFields'
import { customLinkField } from '../common/customLink'

export const University = defineType({
  // Editorial record for a university; the runtime identity lives in Postgres, linked via dbId.
  name: 'university',
  title: 'University',
  type: 'document',
  icon: EarthGlobeIcon,
  preview: {
    select: { title: 'name', subtitle: 'dbId' },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle: subtitle ? `DB: ${subtitle}` : 'Not linked to database',
    }),
  },
  fieldsets: [
    {
      name: 'information',
      title: 'Information',
      description: 'General information for the university.',
    },
    {
      name: 'contactInfo',
      title: 'Contact Information',
      description: 'Contact details for the university.',
    },
    {
      name: 'administration',
      title: 'Administration',
      description: 'Administrative details for the university.',
    },
    {
      name: 'database',
      title: 'Database',
      description: 'Database details for the university.',
    },
  ],
  fields: [
    academicNameField({ fieldset: 'information' }),
    academicDescriptionField({ fieldset: 'information' }),
    academicSlugField(),
    {
      name: 'rector',
      title: 'Rector',
      type: 'reference',
      to: [{ type: 'person' }],
      fieldset: 'administration',
    },
    {
      name: 'viceRectors',
      title: 'Vice Rectors',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'person' }],
        },
      ],
      fieldset: 'administration',
    },
    customLinkField({
      name: 'streetAddress',
      title: 'Street Address Link',
      description:
        'Enter a map URL or an internal path for this university address.',
      fieldset: 'contactInfo',
    }),
    {
      name: 'telephone',
      title: 'Telephone',
      type: 'string',
      fieldset: 'contactInfo',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule: Rule) => rule.email(),
      fieldset: 'contactInfo',
    },
    customLinkField({
      name: 'website',
      title: 'Website',
      description: 'Enter the university website URL.',
      fieldset: 'contactInfo',
    }),
    databaseIdField({ fieldset: 'database' }),
  ],
})
