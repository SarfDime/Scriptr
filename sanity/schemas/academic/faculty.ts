import MasterDetailIcon from '@sanity/icons/MasterDetail'
import type { Rule } from 'sanity'
import { defineType } from 'sanity'
import { customLinkField } from '../common/customLink'
import { validationRules } from '../validation'

export const Faculty = defineType({
  // Editorial record for a faculty; the runtime identity lives in Postgres, linked via dbId.
  name: 'faculty',
  title: 'Faculty',
  type: 'document',
  icon: MasterDetailIcon,
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
      description: 'General information for the faculty.',
    },
    {
      name: 'contactInfo',
      title: 'Contact Information',
      description: 'Contact details for the faculty.',
    },
    {
      name: 'administration',
      title: 'Administration',
      description: 'Administrative details for the faculty.',
    },
    {
      name: 'database',
      title: 'Database',
      description: 'Database details for the faculty.',
    },
  ],
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: validationRules.isRequired,
      fieldset: 'information',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'richTextLite',
      fieldset: 'information',
    },
    {
      name: 'bio',
      title: 'Short Biography',
      type: 'string',
      validation: validationRules.isRequired,
      fieldset: 'information',
    },
    {
      name: 'picture',
      title: 'Picture',
      type: 'image',
      options: { hotspot: true },
      fieldset: 'information',
    },
    {
      name: 'secretary',
      title: 'Secretary',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: validationRules.isRequired,
      fieldset: 'administration',
    },
    {
      name: 'studentCount',
      title: 'Student Count',
      type: 'number',
      validation: validationRules.isRequired,
      fieldset: 'information',
    },
    {
      name: 'dean',
      title: 'Dean',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: validationRules.isRequired,
      fieldset: 'administration',
    },
    {
      name: 'viceDeans',
      title: 'Vice Deans',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'person',
            },
          ],
        },
      ],
      fieldset: 'administration',
    },
    customLinkField({
      name: 'streetAddress',
      title: 'Street Address Link',
      description:
        'Enter a map URL or an internal path for this faculty address.',
      fieldset: 'contactInfo',
    }),
    {
      name: 'telephone',
      title: 'Telephone',
      type: 'string',
      validation: validationRules.isRequired,
      fieldset: 'contactInfo',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: validationRules.emailValidation,
      fieldset: 'contactInfo',
    },
    customLinkField({
      name: 'website',
      title: 'Website',
      description: 'Enter the faculty website URL.',
      fieldset: 'contactInfo',
    }),
    {
      name: 'university',
      title: 'University',
      type: 'reference',
      to: [{ type: 'university' }],
      description:
        'Used to create the database record. Changing the parent university afterwards must be done through the admin API.',
      validation: validationRules.isRequired,
      fieldset: 'database',
    },
    {
      name: 'dbId',
      title: 'Database ID',
      type: 'string',
      readOnly: true,
      description:
        'Set by the "Create in Database" action. Publishing is blocked until this exists.',
      validation: (rule: Rule) =>
        rule.custom((value: string) =>
          value
            ? true
            : 'Run the "Create in Database" action before publishing.'
        ),
      fieldset: 'database',
    },
  ],
})
