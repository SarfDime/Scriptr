import type { SanityDocument } from '@sanity/client'
import type {
  ImageValue,
  PortableTextBlock,
  Rule,
  StringRule,
  ValidationBuilder,
} from 'sanity'
import { flattenRichText, isExternalLink } from './util-functions/utilFunctions'

export const DEFAULT_VALIDATION_RULES = {
  title: {
    min: 1,
    max: 100,
    maxWarning: 70,
  },
  description: {
    max: 250,
    maxWarning: 200,
  },
  subtitle: {
    min: 5,
    max: 80,
    maxWarning: 60,
  },
  content: {
    max: 1000,
    maxWarning: 400,
  },

  longTitle: {
    min: 15,
    max: 100,
    minWarning: 30,
    maxWarning: 70,
  },
  longSubtitle: {
    min: 40,
    max: 150,
    minWarning: 70,
    maxWarning: 130,
  },

  midTitle: {
    min: 5,
    minWarning: 5,
    max: 55,
    maxWarning: 50,
  },
  midSubtitle: {
    min: 5,
    minWarning: 5,
    max: 115,
    maxWarning: 90,
  },

  shortTitle: {
    min: 1,
    max: 20,
  },
  shortSubtitle: {
    min: 3,
    max: 55,
  },
} as const

export const CUSTOM_VALIDATION_RULES = {
  tag: {
    max: 20,
  },
  jobPosting: {
    max: 30,
  },
  country: {
    length: 2,
  },
  featuredPost: {
    max: 1,
  },
  readTime: {
    min: 1,
  },
  slug: {
    min: 2,
    max: 80,
  },
} as const

type ValidatorTemplateProps = {
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

import type { ImageRule } from 'sanity'

export const imageValidation: ValidationBuilder<ImageRule, ImageValue> = (
  rule
) => {
  return rule.required()
}

export const stringValidation: ValidationBuilder<StringRule, string> = (
  rule
) => {
  return rule.required()
}

/** Custom validation rule to ensure a unique string value across documents of the same type */
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

      if (
        currentDocument &&
        currentFieldValue === normalizedValue &&
        !currentId?.startsWith('drafts.')
      ) {
        return true
      }

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

/** Creates an array of validation rules based on provided constraints */
const ValidatorTemplate = ({
  rule,
  max,
  maxWarning,
}: ValidatorTemplateProps) => {
  const rules = [
    // Min validation causes bug with validation on rich text that's why custom validation bellow
    // Max validation is required here along the custom one bellow to make char counter work
    // TODO: Revert to error once major content changes are done
    // TODO: Should add min here if the item is a string, need to
    // revamp this but no time right now, it will show double warnings who cares.
    max &&
      rule.max(max).warning(`You are allowed to write up to ${max} characters`),
    maxWarning &&
      rule
        .max(maxWarning)
        .warning(
          `For better SEO, use concise content under ${maxWarning} characters`
        ),
  ].filter((item): item is Rule => Boolean(item))

  return rules.length ? rules : undefined
}

/** Creates validation rules for rich text content */
const ExtendedValidation = (props: ValidatorTemplateProps) => {
  const { rule, isRequired, max, min, minWarning, maxWarning } = props
  return [
    ...(ValidatorTemplate?.(props) ?? []),
    rule.custom((richTextBlocks: Array<PortableTextBlock>) => {
      const text = !Array.isArray(richTextBlocks)
        ? richTextBlocks
        : flattenRichText(richTextBlocks)

      const length = text?.length

      if (isRequired && !text) return 'Field cannot be empty'
      if (isRequired && min && length < min)
        return `Minimum ${min} characters required`
      if (max && length > max) return `Maximum ${max} characters allowed`
      return true
    }),
    rule
      .custom((richTextBlocks: Array<PortableTextBlock>) => {
        const text = !Array.isArray(richTextBlocks)
          ? richTextBlocks
          : flattenRichText(richTextBlocks)

        const length = text?.length
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
        if (max && length > max)
          return {
            message: `Maximum ${max} characters allowed (${length}/${max})`,
            severity: 'error',
          }
        return true
      })
      .warning(),
  ]
}

export const validationRules = {
  descriptionValidation: (rule: Rule, isRequired?: boolean) =>
    ExtendedValidation({
      rule,
      isRequired,
      ...DEFAULT_VALIDATION_RULES.description,
    }),

  productCardsValidation: (rule: Rule) => rule.required().min(1),

  countryValidation: (rule: Rule) => [
    rule.custom((value: string) => {
      if (value && value?.length === 0) {
        return 'Country code cannot be empty'
      }
      if (value?.length !== CUSTOM_VALIDATION_RULES.country.length) {
        return `Country code must be ${CUSTOM_VALIDATION_RULES.country.length} characters long`
      }
      return true
    }),
  ],
  faqCategoryValidation: (rule: Rule) => [rule.required().unique()],
  intersectSectionsValidation: (rule: Rule) =>
    rule.custom((value: string) => {
      if (value && value?.length === 0) {
        return 'Tag cannot be empty'
      }
      return true
    }),
  slugValidation: (rule: Rule, isRequired = true) => [
    rule.custom((value: { current: string }) => {
      const slug = value?.current
      if (isRequired) {
        if (!slug) {
          return 'A slug is required'
        }
      } else if (!isRequired && !slug) {
        return true
      }

      if (slug !== slug.toLowerCase()) {
        return 'The slug must be written in lowercase'
      }
      if (!/^[a-z0-9-]+$/i.test(slug)) {
        return 'The slug should contain only letters, numbers, or hyphens'
      }
      if (slug.endsWith('-')) {
        return 'The slug should not end with a hyphen'
      }

      if (slug.length < CUSTOM_VALIDATION_RULES.slug.min) {
        return `A slug of at least ${CUSTOM_VALIDATION_RULES.slug.min} characters is required`
      }
      if (slug.length > CUSTOM_VALIDATION_RULES.slug.max) {
        return `You are allowed to write up to ${CUSTOM_VALIDATION_RULES.slug.max} characters`
      }

      return true
    }),
  ],

  urlValidation: (rule: StringRule) =>
    rule.required().custom((value: string | undefined) => {
      if (!value) return true

      if (!value.startsWith('https:') && !value.startsWith('/')) {
        return 'Only use https urls or internal paths starting with /'
      }

      if (value && !isExternalLink(value)) {
        if (value.endsWith('/') && value.length > 1) {
          return `A path should not end with '/'`
        }
      }

      return true
    }),

  emailValidation: (rule: Rule) => rule.required().email(),

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

      if (!value) {
        return `${validationFieldTitle ?? 'Field'} cannot be empty`
      }

      if (value && !value?.startsWith('https:') && !value?.startsWith('/')) {
        return 'Only use https urls or internal paths starting with /'
      }

      if (value && !isExternalLink(value)) {
        if (value?.endsWith('/')) {
          return `A path should not end with '/'`
        }
      }

      return true
    }),

  customParamsValidation: (rule: Rule) =>
    rule.custom((value: string, context) => {
      const { linkType, customParamsButton } =
        context.document as SanityDocument

      if (linkType !== 'custom') return true

      if (!customParamsButton) return true

      if (value) {
        if (value?.startsWith('/')) {
          return `A path should not start with '/'`
        }
        if (value?.startsWith('http')) {
          return 'Only use https urls or internal paths starting with /'
        }
        if (value?.endsWith('/')) {
          return `A path should not end with '/'`
        }
      }

      return true
    }),

  // When we need to be required usually at slug
  isRequired: (rule: Rule) => rule.required(),
  // Validation for number of articles in mini blog section
  articleNumberValidation: (rule: Rule) => [
    rule
      .required()
      .min(1)
      .error('You need to have at least one article in this section.'),
    rule
      .max(3)
      .error('You can only have a maximum of three articles in this section.'),
  ],
} as const
