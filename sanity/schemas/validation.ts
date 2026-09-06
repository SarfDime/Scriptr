import type { SanityDocument } from '@sanity/client'
import type { ImageValue, Rule, StringRule, ValidationBuilder } from 'sanity'
import { isExternalLink } from './util-functions/utilFunctions'

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

export const validationRules = {
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
