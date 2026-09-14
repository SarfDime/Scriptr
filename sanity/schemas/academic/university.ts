import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import { defineType } from 'sanity'
import {
  academicFields,
  academicGrouping,
  academicPreview,
} from '../common/academicFields'

const ENTITY = 'university'

export const University = defineType({
  // Editorial record for a university; the runtime identity lives in Postgres, linked via dbId.
  name: 'university',
  title: 'University',
  type: 'document',
  icon: EarthGlobeIcon,
  ...academicPreview(),
  ...academicGrouping(ENTITY),
  fields: [
    ...academicFields(ENTITY, [
      'logo',
      'picture',
      'name',
      'slug',
      'description',
    ]),
    {
      name: 'rector',
      title: 'Rector',
      type: 'reference',
      to: [{ type: 'person' }],
      fieldset: 'administration',
      group: 'administration',
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
      group: 'administration',
    },
    ...academicFields(ENTITY, [
      'streetAddress',
      'telephone',
      'email',
      'website',
    ]),
    {
      name: 'r2BucketId',
      title: 'R2 Bucket ID',
      description:
        "Cloudflare R2 bucket used for this university's file storage. Must be an existing bucket name.",
      type: 'string',
      validation: (rule) =>
        rule
          .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, {
            name: 'r2 bucket name',
          })
          .warning('Should follow S3/R2 bucket naming rules'),
      fieldset: 'database',
      group: 'database',
    },
    ...academicFields(ENTITY, ['dbId']),
  ],
})
