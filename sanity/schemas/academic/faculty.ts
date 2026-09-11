import MasterDetailIcon from '@sanity/icons/MasterDetail'
import { defineType } from 'sanity'
import {
  academicDescriptionField,
  academicNameField,
  academicSlugField,
  databaseIdField,
} from '../common/academicFields'
import { customLinkField } from '../common/customLink'
import { validationRules } from '../validation'

export const Faculty = defineType({
  // Editorial record for a faculty; the runtime identity lives in Postgres, linked via dbId.
  name: 'faculty',
  title: 'Faculty',
  type: 'document',
  icon: MasterDetailIcon,
  // TODO: Preview should also be preset in a reusable configurable util like academic[Field]Field

  preview: {
    select: { title: 'name', subtitle: 'dbId' },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle: subtitle ? `DB: ${subtitle}` : 'Not linked to database',
    }),
  },
  fieldsets: [
    // TODO: Fieldsets should also be preset in a reusable configurable util like academic[Field]Field
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
    academicNameField({ fieldset: 'information' }),
    academicDescriptionField({ fieldset: 'information', required: true }),
    academicSlugField({ hierarchy: 'faculty' }),
    // TODO: More of these should be made into reusable fields,
    // for example picture, bio, email, telephone, student count,
    // and the fieldset should be already set, only pass to override,
    // instead of redefining each time.
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
    databaseIdField({ fieldset: 'database' }),
  ],
})
