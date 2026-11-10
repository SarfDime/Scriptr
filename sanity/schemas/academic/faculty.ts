import MasterDetailIcon from '@sanity/icons/MasterDetail'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'
import { validationRules } from '../validation'

const ENTITY = 'faculty'

export const Faculty = defineType({
  // Editorial record for a faculty; the runtime identity lives in Postgres, linked via dbId.
  name: 'faculty',
  title: 'Faculty',
  type: 'document',
  icon: MasterDetailIcon,
  ...academicPreview({
    icon: MasterDetailIcon,
    pictureField: 'logo',
  }),
  ...academicGrouping(ENTITY),
  fields: [
    ...academicFields(
      ENTITY,
      ['name', 'slug', 'description', 'studentCount', 'bio', 'logo', 'picture'],
      {
        overrides: {
          description: { required: true },
          bio: { required: false, type: 'string' },
        },
      }
    ),
    {
      name: 'secretary',
      title: 'Secretary',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: validationRules.isRequired,
      fieldset: 'administration',
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
    ...academicFields(
      ENTITY,
      ['streetAddress', 'telephone', 'email', 'website'],
      {
        overrides: {
          telephone: { required: true },
          email: { required: true },
        },
      }
    ),
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
    ...academicFields(ENTITY, ['dbId']),
  ],
})
