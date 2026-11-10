import { defineField } from 'sanity'
import { customLinkField } from './customLink'

// TODO: re-introduce internal links. The selector should target academic
// entities (university/faculty/study/subject) and the website's database
// pages instead of the removed Sanity `page` documents. Until then every
// nav/button link is a custom path or URL.
export const linkSelector = [
  defineField({
    ...customLinkField({
      description:
        'A path or URL the item links to (e.g. "/university/..." or "https://example.com").',
      required: true,
    }),
  }),
]
