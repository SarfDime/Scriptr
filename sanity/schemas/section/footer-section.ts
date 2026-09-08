import { defineType } from 'sanity'
import { internalUseTitle } from '../common/headerFields'
import { slugSchemaField } from '../common/slug'

export const FooterSection = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      media: 'footerWebsiteLogo',
    },
  },
  groups: [
    {
      name: 'social',
      title: 'Social',
    },
    {
      name: 'navigation',
      title: 'Navigation',
    },
    {
      name: 'WebsiteInfo',
      title: 'Website Info',
    },
  ],
  fields: [
    internalUseTitle,
    slugSchemaField({
      title: 'Footer section anchor link',
      description:
        'The path for the footer section that will act as anchor link. Do not add "#" symbol. (e.g. "footer-section")',
    }),
    {
      title: `Website's logo`,
      name: 'footerWebsiteLogo',
      type: 'image',
      description: `Used for rendering the website's logo on the left side of the footer.`,
      group: 'social',
      options: {
        hotspot: true,
      },
    },
    {
      title: 'Footer navigation menu',
      name: 'footerNavigationMenu',
      type: 'array',
      description: 'Field for adding items to the footer navigation menu.',
      group: 'navigation',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'navMenu',
            },
          ],
        },
      ],
    },
    {
      title: 'Copyright and disclaimer content',
      name: 'copyrightContent',
      type: 'richText',
      description: 'Field for adding the copyright and disclaimer content.',
      group: 'WebsiteInfo',
    },
  ],
})
