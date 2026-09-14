import type { SanityDocument } from '@sanity/client'
import type {
  ImageRule,
  ImageValue,
  PortableTextBlock,
  Rule,
  StringRule,
  ValidationBuilder,
} from 'sanity'
import { flattenRichText, isExternalLink } from './util-functions/utilFunctions'

// ---------------------------------------------------------------------------
// Length presets
// ---------------------------------------------------------------------------

export const DEFAULT_VALIDATION_RULES = {
  title: { min: 1, max: 100, maxWarning: 70 },
  description: { max: 250, maxWarning: 200 },
  subtitle: { min: 5, max: 80, maxWarning: 60 },
  content: { max: 1000, maxWarning: 400 },

  longTitle: { min: 15, max: 100, minWarning: 30, maxWarning: 70 },
  longSubtitle: { min: 40, max: 150, minWarning: 70, maxWarning: 130 },

  midTitle: { min: 5, minWarning: 5, max: 55, maxWarning: 50 },
  midSubtitle: { min: 5, minWarning: 5, max: 115, maxWarning: 90 },

  shortTitle: { min: 1, max: 20 },
  shortSubtitle: { min: 3, max: 55 },
} as const

export const CUSTOM_VALIDATION_RULES = {
  tag: { max: 20 },
  jobPosting: { max: 30 },
  country: { length: 2 },
  featuredPost: { max: 1 },
  readTime: { min: 1 },
  slug: { min: 2, max: 80 },
} as const

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type LengthValidationProps = {
  rule: Rule
  isRequired?: boolean
  max?: number
  min?: number
  minWarning?: number
  maxWarning?: number
}

type UniqueStringValidationOptions = {
  documentType: string
  fieldName: string
  message?: string
  normalize?: (value: string) => string
  caseSensitive?: boolean
}

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const imageValidation: ValidationBuilder<ImageRule, ImageValue> = (
  rule
) => rule.required()

export const stringValidation: ValidationBuilder<StringRule, string> = (rule) =>
  rule.required()

/** Ensures a string field is unique across other documents of the same type. */
export const uniqueStringValidation =
  ({
    documentType,
    fieldName,
    message,
    normalize = (value) => value?.trim()?.toLowerCase(),
    caseSensitive = false,
  }: UniqueStringValidationOptions) =>
  (rule: Rule) =>
    rule.custom(async (value, context) => {
      if (typeof value !== 'string') return true

      const trimmedValue = value?.trim()
      if (!trimmedValue) return true

      const normalizedValue = normalize(trimmedValue)
      if (!normalizedValue) return true

      const currentDocument = context?.document as SanityDocument | undefined
      const currentId = currentDocument?._id ?? 'drafts.__new__'

      const currentFieldValue =
        currentDocument && typeof currentDocument[fieldName] === 'string'
          ? normalize(currentDocument[fieldName] as string)
          : ''

      const isUnchangedOnPublishedDoc =
        currentDocument &&
        currentFieldValue === normalizedValue &&
        !currentId.startsWith('drafts.')

      if (isUnchangedOnPublishedDoc) return true

      const client = context.getClient({ apiVersion: '2024-01-01' })
      const query = `*[
        _type == $documentType &&
        _id != $currentId &&
        defined(${fieldName}) &&
        ${caseSensitive ? fieldName : `lower(${fieldName})`} == $value
      ][0]{_id}`

      const existingDocument = await client.fetch<{ _id: string } | null>(
        query,
        {
          documentType,
          currentId,
          value: caseSensitive
            ? normalizedValue
            : normalizedValue?.toLowerCase(),
        },
        { perspective: 'raw' }
      )

      return existingDocument
        ? (message ?? `This ${fieldName} is already in use.`)
        : true
    })

// ---------------------------------------------------------------------------
// Length + rich text helpers
// ---------------------------------------------------------------------------

/** Character length of a field value, whether it's a plain string or Portable Text. */
const getTextLength = (value: string | Array<PortableTextBlock>) => {
  const text = Array.isArray(value) ? flattenRichText(value) : value
  return text?.length ?? 0
}

/** Max-length rule (hard cap) plus an SEO-oriented warning threshold, shared across field types. */
const buildLengthRules = ({ rule, max, maxWarning }: LengthValidationProps) => {
  const rules = [
    // Min validation causes a bug with validation on rich text, hence the custom validation below.
    // Max validation is still required here (alongside the custom one below) to power the char counter.
    // TODO: Add min here for string fields too — needs a revamp, skipping for now since it'd just
    // double up the warning message.
    max &&
      rule.max(max).error(`You are allowed to write up to ${max} characters`),
    maxWarning &&
      rule
        .max(maxWarning)
        .warning(
          `For better SEO, use concise content under ${maxWarning} characters`
        ),
  ].filter((item): item is Rule => Boolean(item))

  return rules.length ? rules : undefined
}

/** Length validation for rich text (Portable Text) fields, with required/min/max + SEO warnings. */
const richTextValidation = (props: LengthValidationProps) => {
  const { rule, isRequired, max, min, minWarning, maxWarning } = props

  return [
    ...(buildLengthRules(props) ?? []),
    rule.custom((value: Array<PortableTextBlock>) => {
      const length = getTextLength(value)

      if (isRequired && !length) return 'Field cannot be empty'
      if (isRequired && min && length < min)
        return `Minimum ${min} characters required`
      if (max && length > max) return `Maximum ${max} characters allowed`
      return true
    }),
    rule
      .custom((value: Array<PortableTextBlock>) => {
        const length = getTextLength(value)

        if (minWarning && length < minWarning) {
          return {
            message: `Recommended min ${minWarning} characters for SEO (${length}/${minWarning})`,
            severity: 'warning',
          }
        }
        if (maxWarning && length > maxWarning) {
          return {
            message: `Recommended max ${maxWarning} characters for SEO (${length}/${maxWarning})`,
            severity: 'warning',
          }
        }
        if (max && length > max) {
          return {
            message: `Maximum ${max} characters allowed (${length}/${max})`,
            severity: 'error',
          }
        }
        return true
      })
      .warning(),
  ]
}

// ---------------------------------------------------------------------------
// Link format helper — shared by every validator that needs to check a value
// is either an https URL or an internal path (customLink, link selector).
// ---------------------------------------------------------------------------

const validateLinkFormat = (value: string): string | true => {
  if (!value.startsWith('https:') && !value.startsWith('/')) {
    return 'Only use https urls or internal paths starting with /'
  }
  if (!isExternalLink(value) && value.endsWith('/') && value.length > 1) {
    return `A path should not end with '/'`
  }
  return true
}

// ---------------------------------------------------------------------------
// Public validators
// ---------------------------------------------------------------------------

export const validationRules = {
  // -- Text length --
  descriptionValidation: (rule: Rule, isRequired?: boolean) =>
    richTextValidation({
      rule,
      isRequired,
      ...DEFAULT_VALIDATION_RULES.description,
    }),

  // -- Links / URLs --
  urlValidation: (rule: StringRule) =>
    rule.required().custom((value: string | undefined) => {
      if (!value) return true
      return validateLinkFormat(value)
    }),

  linkSelectorInternalFieldsValidation: (rule: Rule) =>
    rule.custom((value, context) => {
      const { customLink } = context.document as SanityDocument
      if (customLink && value !== undefined) {
        return 'Cannot set both page and custom path or link. Please delete the custom path/link.'
      }
      return true
    }),

  linkSelectorCustomLinkValidation: (rule: Rule) =>
    rule.custom((value: string, context) => {
      const { allPages, linkType } = context.document as SanityDocument
      const validationFieldTitle = context?.type?.title

      if (allPages?._ref && value !== undefined) {
        return 'Cannot set both page or modal and custom path or link. Please delete the page reference.'
      }
      if (linkType !== 'custom') return true
      if (!value) return `${validationFieldTitle ?? 'Field'} cannot be empty`

      return validateLinkFormat(value)
    }),

  customParamsValidation: (rule: Rule) =>
    rule.custom((value: string, context) => {
      const { linkType, customParamsButton } =
        context.document as SanityDocument

      if (linkType !== 'custom' || !customParamsButton || !value) return true

      if (value.startsWith('/')) return `A path should not start with '/'`
      if (value.startsWith('http'))
        return 'Only use https urls or internal paths starting with /'
      if (value.endsWith('/')) return `A path should not end with '/'`

      return true
    }),

  // -- Slugs / identifiers --
  slugValidation: (rule: Rule, isRequired = true) => [
    rule.custom((value: { current: string }) => {
      const slug = value?.current
      if (!slug) return isRequired ? 'A slug is required' : true

      if (slug !== slug.toLowerCase())
        return 'The slug must be written in lowercase'
      if (!/^[a-z0-9-]+$/i.test(slug))
        return 'The slug should contain only letters, numbers, or hyphens'
      if (slug.endsWith('-')) return 'The slug should not end with a hyphen'
      if (slug.length < CUSTOM_VALIDATION_RULES.slug.min) {
        return `A slug of at least ${CUSTOM_VALIDATION_RULES.slug.min} characters is required`
      }
      if (slug.length > CUSTOM_VALIDATION_RULES.slug.max) {
        return `You are allowed to write up to ${CUSTOM_VALIDATION_RULES.slug.max} characters`
      }

      return true
    }),
  ],

  countryValidation: (rule: Rule) => [
    rule.custom((value: string) => {
      if (value?.length === 0) return 'Country code cannot be empty'
      if (value?.length !== CUSTOM_VALIDATION_RULES.country.length) {
        return `Country code must be ${CUSTOM_VALIDATION_RULES.country.length} characters long`
      }
      return true
    }),
  ],

  // -- Misc field-specific --
  emailValidation: (rule: StringRule) => rule.required().email(),
  optionalEmailValidation: (rule: StringRule) => rule.email(),

  faqCategoryValidation: (rule: Rule) => [rule.required().unique()],

  intersectSectionsValidation: (rule: Rule) =>
    rule.custom((value: string) => {
      if (value?.length === 0) return 'Tag cannot be empty'
      return true
    }),

  productCardsValidation: (rule: Rule) => rule.required().min(1),

  // Number of articles allowed in a mini blog section.
  articleNumberValidation: (rule: Rule) => [
    rule
      .required()
      .min(1)
      .error('You need to have at least one article in this section.'),
    rule
      .max(3)
      .error('You can only have a maximum of three articles in this section.'),
  ],

  // When we just need `.required()` — mainly used for slugs.
  isRequired: (rule: Rule) => rule.required(),
} as const
