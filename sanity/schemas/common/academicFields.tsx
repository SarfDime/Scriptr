import type { AcademicEntityType } from '@shared/config/api'
import { GROUPING_KEYS } from '@shared/config/sanity-constants'
import type { ElementType, ReactNode } from 'react'
import {
  defineField,
  type FieldDefinition,
  type PreviewValue,
  type SlugRule,
} from 'sanity'
import { DbLinkedIcon } from '../../components/icons/DbLinkedIcon'
import { SubjectDynamicIcon } from '../../components/icons/SubjectDynamicIcon'
import type {
  AcademicFieldOptions,
  GroupingKeys,
} from '../../types/schema-prop.types'
import {
  convertImageIdToUrl,
  sanitizeSlug,
} from '../util-functions/utilFunctions'
import { stringValidation, validationRules } from '../validation'
import { type CustomLinkFieldOptions, customLinkField } from './customLink'

const GROUPING_PRESETS: Record<
  GroupingKeys,
  { title: string; description: (entity: AcademicEntityType) => string }
> = {
  information: {
    title: 'Information',
    description: (entity) => `General information for the ${entity}.`,
  },
  contactInfo: {
    title: 'Contact Information',
    description: (entity) => `Contact details for the ${entity}.`,
  },
  administration: {
    title: 'Administration',
    description: (entity) => `Administrative details for the ${entity}.`,
  },
  academic: {
    title: 'Academic',
    description: (entity) => `Academic curriculum details for the ${entity}.`,
  },
  database: {
    title: 'Database',
    description: (entity) => `Database details for the ${entity}.`,
  },
  media: {
    title: 'Media',
    description: (entity) => `Media assets for the ${entity}.`,
  },
}

/** Builds a schema's `fieldsets` array from the shared presets above. */
export const academicGrouping = (
  entity: AcademicEntityType,
  keys: Array<GroupingKeys> = [...GROUPING_KEYS]
) => {
  const grouping = keys.map((key) => ({
    name: key,
    title: GROUPING_PRESETS[key].title,
    description: GROUPING_PRESETS[key].description(entity),
  }))
  return { fieldsets: grouping, groups: grouping }
}

export const academicPreview = <T extends Record<string, string>>({
  selectExtra,
  formatSubtitle,
  subtitle: legacySubtitleField,
  icon,
  isSubject = false,
  pictureField = 'picture',
}: {
  selectExtra?: T
  formatSubtitle?: (selection: Record<string, unknown>) => string | undefined
  subtitle?: string
  icon?: ElementType
  isSubject?: boolean
  pictureField?: string
} = {}) => ({
  preview: {
    select: {
      title: 'name',
      dbId: 'dbId',
      year: 'year',
      semester: 'semester',
      elective: 'elective',
      imageUrl: `${pictureField}`,
      ...(legacySubtitleField ? { legacySubtitle: legacySubtitleField } : {}),
      ...(selectExtra ?? {}),
    },
    prepare: (selection: Record<string, unknown>): PreviewValue => {
      const {
        title,
        dbId,
        year,
        semester,
        elective,
        imageUrl,
        legacySubtitle,
      } = selection as {
        title?: string
        dbId?: string
        year?: number
        semester?: number
        elective?: boolean
        imageUrl?: { asset?: { _ref?: string } }
        legacySubtitle?: string
      }

      let customMedia: ReactNode

      if (isSubject) {
        customMedia = (
          <SubjectDynamicIcon
            dbId={dbId}
            year={year}
            semester={semester}
            elective={elective}
          />
        )
      } else {
        customMedia = (
          <DbLinkedIcon
            dbId={dbId}
            imageUrl={convertImageIdToUrl(imageUrl?.asset?._ref)}
            icon={icon}
          />
        )
      }

      let subtitle: string | undefined

      if (formatSubtitle) {
        subtitle = formatSubtitle(selection) ?? undefined
      } else if (legacySubtitle) {
        subtitle = String(legacySubtitle)
      }

      return {
        title: title ?? 'Untitled',
        subtitle,
        ...(customMedia ? { media: customMedia } : {}),
      }
    },
  },
})

// ---------------------------------------------------------------------------
// Individual field builders. Each knows its own sensible defaults; callers
// only override what actually differs for their schema.
// ---------------------------------------------------------------------------

export const academicNameField = ({
  grouping = 'information',
}: AcademicFieldOptions): FieldDefinition =>
  defineField({
    name: 'name',
    title: 'Name',
    type: 'string',
    validation: (rule) => rule.required(),
    fieldset: grouping,
    group: grouping,
  })

export const academicTitleField = ({
  grouping = 'information',
}: AcademicFieldOptions): FieldDefinition =>
  defineField({
    name: 'title',
    title: 'Academic Title',
    type: 'string',
    fieldset: grouping,
    group: grouping,
  })

export const academicDescriptionField = ({
  grouping = 'information',
  required = false,
}: AcademicFieldOptions & { required?: boolean }): FieldDefinition =>
  defineField({
    name: 'description',
    title: 'Description',
    type: 'richTextLite',
    fieldset: grouping,
    group: grouping,
    validation: required
      ? (rule) => validationRules.descriptionValidation(rule)
      : undefined,
  })

export const databaseIdField = ({
  grouping = 'database',
}: AcademicFieldOptions): FieldDefinition =>
  defineField({
    name: 'dbId',
    title: 'Database ID',
    type: 'string',
    readOnly: true,
    description:
      'Set by the "Create in Database" action. Publishing is blocked until this exists.',
    validation: (rule) =>
      rule.custom((value: string | undefined) =>
        value ? true : 'Run the "Create in Database" action before publishing.'
      ),
    fieldset: grouping,
    group: grouping,
  })

export const academicImageField = (
  name: 'logo' | 'picture',
  { grouping = 'media' }: AcademicFieldOptions
): FieldDefinition =>
  defineField({
    name,
    title: name === 'logo' ? 'Logo' : 'Picture',
    type: 'image',
    options: { hotspot: true },
    fieldset: grouping,
    group: grouping,
  })

export const academicKeywordsField = ({
  grouping = 'information',
  required = false,
}: AcademicFieldOptions & { required?: boolean }): FieldDefinition =>
  defineField({
    name: 'keywords',
    title: 'Keywords',
    description: 'Keywords or tags associated with the subject.',
    type: 'array',
    of: [{ type: 'string' }],
    fieldset: grouping,
    group: grouping,
    validation: required ? (rule) => rule.required() : undefined,
  })

type AcademicBioOptions = AcademicFieldOptions & {
  type?: 'string' | 'richTextLite'
  required?: boolean
}

export const academicBioField = (
  {
    grouping = 'information',
    type = 'richTextLite',
    required = false,
  }: AcademicBioOptions = {
    type: 'richTextLite',
    required: false,
  }
): FieldDefinition => {
  const title = type === 'string' ? 'Short Biography' : 'Bio'

  // 'string' goes through defineField's dedicated string overload, which
  // demands a StringRule-typed validator; richTextLite has no such overload,
  // so the generic Rule-typed validationRules.isRequired fits it directly.
  return type === 'string'
    ? defineField({
        name: 'bio',
        title,
        type: 'string',
        fieldset: grouping,
        group: grouping,
        validation: required ? stringValidation : undefined,
      })
    : defineField({
        name: 'bio',
        title,
        type: 'richTextLite',
        fieldset: grouping,
        group: grouping,
        validation: required ? validationRules.isRequired : undefined,
      })
}

export const academicStudentCountField = ({
  grouping = 'information',
  required = false,
}: AcademicFieldOptions & { required?: boolean }): FieldDefinition =>
  defineField({
    name: 'studentCount',
    title: 'Student Count',
    description: 'Number of students associated attending.',
    type: 'number',
    fieldset: grouping,
    group: grouping,
    validation: required ? (rule) => rule.required() : undefined,
  })

export const academicTelephoneField = ({
  grouping = 'contactInfo',
  required = false,
}: AcademicFieldOptions & { required?: boolean }): FieldDefinition => {
  return defineField({
    name: 'telephone',
    title: 'Telephone',
    type: 'string',
    fieldset: grouping,
    group: grouping,
    validation: required ? stringValidation : undefined,
  })
}

export const academicEmailField = ({
  grouping = 'contactInfo',
  required = false,
}: AcademicFieldOptions & { required?: boolean }): FieldDefinition =>
  defineField({
    name: 'email',
    title: 'Email',
    type: 'string',
    fieldset: grouping,
    group: grouping,
    validation: required
      ? validationRules.emailValidation
      : validationRules.optionalEmailValidation,
  })

type AcademicLinkFieldOptions = Omit<
  CustomLinkFieldOptions,
  'name' | 'title'
> & {
  entity?: AcademicEntityType
}

export const academicWebsiteField = ({
  entity,
  grouping = 'contactInfo',
  required = false,
  ...rest
}: AcademicLinkFieldOptions): FieldDefinition =>
  customLinkField({
    name: 'website',
    title: 'Website',
    description: `Enter the ${entity} website URL.`,
    grouping,
    required,
    ...rest,
  })

export const academicStreetAddressField = ({
  entity,
  grouping = 'contactInfo',
  ...rest
}: AcademicLinkFieldOptions): FieldDefinition =>
  customLinkField({
    name: 'streetAddress',
    title: 'Street Address Link',
    description: `Enter a map URL or an internal path for this ${entity} address.`,
    grouping,
    ...rest,
  })

export const academicOfficeLocationField = ({
  entity,
  grouping = 'contactInfo',
  required = false,
  ...rest
}: AcademicLinkFieldOptions): FieldDefinition =>
  customLinkField({
    name: 'officeLocation',
    title: 'Office Location Address',
    description: `Enter a map URL or an internal path for this ${entity} office location.`,
    grouping,
    required,
    ...rest,
  })

export const academicSlugField = ({
  grouping = 'information',
  required = false,
  ...rest
}: Omit<AcademicLinkFieldOptions, 'validation'>): FieldDefinition => {
  return defineField({
    name: 'slug',
    title: 'URL Slug',
    description:
      'URL-friendly version of the name. Click generate to create it automatically.',
    type: 'slug',
    options: {
      source: 'name',
      slugify: (value) => sanitizeSlug(value),
    },
    validation: (rule: SlugRule) =>
      validationRules.slugValidation(rule, required),
    fieldset: grouping,
    group: grouping,
    ...rest,
  })
}

// ---------------------------------------------------------------------------
// Wrapper — the entry point most schemas should reach for. Pass the entity
// name (used to auto-fill copy like "Enter the <entity> website URL."), the
// field keys you want in the order they should render, a shared fieldset for
// the group, and per-field overrides only where a schema differs from the
// defaults (required, wording, bio type, etc.).
// ---------------------------------------------------------------------------

export type AcademicFieldKey =
  | 'name'
  | 'title'
  | 'description'
  | 'keywords'
  | 'bio'
  | 'logo'
  | 'picture'
  | 'telephone'
  | 'email'
  | 'website'
  | 'streetAddress'
  | 'office'
  | 'slug'
  | 'dbId'
  | 'studentCount'

export type AcademicFieldsOverrides = Partial<{
  name: AcademicFieldOptions
  title: AcademicFieldOptions
  description: AcademicFieldOptions & { required?: boolean }
  keywords: AcademicFieldOptions
  bio: AcademicBioOptions
  logo: AcademicFieldOptions
  picture: AcademicFieldOptions
  telephone: AcademicFieldOptions & { required?: boolean }
  email: AcademicFieldOptions & { required?: boolean }
  website: AcademicLinkFieldOptions
  streetAddress: AcademicLinkFieldOptions
  office: AcademicLinkFieldOptions
  dbId: AcademicFieldOptions
  studentCount: AcademicFieldOptions
}>

type AcademicFieldContext = {
  entity: AcademicEntityType
  grouping?: GroupingKeys
  overrides: AcademicFieldsOverrides
}

const FIELD_BUILDERS: Record<
  AcademicFieldKey,
  (context: AcademicFieldContext) => FieldDefinition
> = {
  slug: ({ grouping }) => academicSlugField({ grouping }),
  name: ({ grouping, overrides }) =>
    academicNameField({ grouping, ...overrides.name }),
  title: ({ grouping, overrides }) =>
    academicTitleField({ grouping, ...overrides.title }),
  description: ({ grouping, overrides }) =>
    academicDescriptionField({
      grouping,
      ...overrides.description,
    }),
  studentCount: ({ grouping, overrides }) =>
    academicStudentCountField({ grouping, ...overrides.studentCount }),
  keywords: ({ grouping, overrides }) =>
    academicKeywordsField({ grouping, ...overrides.keywords }),
  bio: ({ grouping, overrides }) =>
    academicBioField({ grouping, ...overrides.bio }),
  logo: ({ grouping, overrides }) =>
    academicImageField('logo', {
      grouping,
      ...overrides.logo,
    }),
  picture: ({ grouping, overrides }) =>
    academicImageField('picture', {
      grouping,
      ...overrides.picture,
    }),
  telephone: ({ grouping, overrides }) =>
    academicTelephoneField({
      grouping,
      ...overrides.telephone,
    }),
  email: ({ grouping, overrides }) =>
    academicEmailField({ grouping, ...overrides.email }),
  website: ({ entity, grouping, overrides }) =>
    academicWebsiteField({ entity, grouping, ...overrides.website }),
  streetAddress: ({ entity, grouping, overrides }) =>
    academicStreetAddressField({
      entity,
      grouping,
      ...overrides.streetAddress,
    }),
  office: ({ entity, grouping, overrides }) =>
    academicOfficeLocationField({ entity, grouping, ...overrides.office }),
  dbId: ({ grouping, overrides }) =>
    databaseIdField({ grouping, ...overrides.dbId }),
}

export function academicFields(
  entity: AcademicEntityType,
  keys: Array<AcademicFieldKey>,
  {
    grouping,
    overrides = {},
  }: {
    grouping?: GroupingKeys
    overrides?: AcademicFieldsOverrides
  } = {}
): Array<FieldDefinition> {
  return keys.map((key) =>
    FIELD_BUILDERS[key]({
      entity,
      grouping,
      overrides,
    })
  )
}
