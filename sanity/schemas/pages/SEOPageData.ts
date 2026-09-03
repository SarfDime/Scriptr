import { headerSchemaFields } from '../common/headerFields'
import { validationRules } from '../validation'

export const SEOPageData = (unValidated?: boolean) => [
  ...headerSchemaFields({
    title: 'Page title',
    description: 'A clear title representing the page content.',
    type: 'string',
    group: 'seoData',
    fieldset: 'seoData',
    isRequired: !unValidated,
    subtitle: {
      showSubtitle: true,
      title: 'Page description',
      type: 'string',
      description: 'Open Graph description for SEO & social sharing',
      group: 'seoData',
      fieldset: 'seoData',
      isRequired: !unValidated,
    },
  }),
  {
    title: 'Keywords for SEO and social sharing',
    name: 'seoKeywords',
    type: 'array',
    of: [{ type: 'string' }],
    group: 'seoData',
    fieldset: 'seoData',
    description:
      'Keywords that are as enticing as possible to invite users in social feeds and Google searches',
    validation: unValidated ? undefined : validationRules.isRequired,
  },
  {
    title: 'Open graph image',
    name: 'seoImage',
    type: 'image',
    group: 'seoData',
    fieldset: 'seoData',
    options: {
      hotspot: true,
    },
    description:
      'An image that will be used as a thumbnail when your web page is shared on social media platforms like Facebook, Twitter..',
    validation: unValidated ? undefined : validationRules.isRequired,
  },
]
