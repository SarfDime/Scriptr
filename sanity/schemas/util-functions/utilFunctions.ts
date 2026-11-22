import type { PortableTextBlock } from 'sanity'
import { sanityDataset, sanityProjectId } from '../../env'
import type { LocalizedHeaderPreviewProps } from '../../types/common.types'

/**
 * Flatten a Portable Text block array into a plain string,
 * including annotations and custom inline objects.
 */
export const flattenRichText = (blocks: Array<PortableTextBlock>) => {
  if (!blocks || !Array.isArray(blocks)) return blocks ?? ''
  return blocks
    .filter((block) => block._type === 'block' && block?.children)
    .flatMap((block) => {
      if (Array.isArray(block?.children))
        return block?.children?.map(
          (child: {
            text: string
            rate: string
            year: string
            george: string
          }) => child?.text ?? child?.rate ?? child?.year ?? child?.george ?? ''
        )
      return []
    })
    .join('')
    .trim()
}

/**
 * Flatten a Portable Text block array into a plain string
 * and get only first block
 */
const flattenFirstRichTextBlock = (
  blocks: Array<PortableTextBlock> | undefined
) => {
  if (!Array.isArray(blocks)) return blocks ?? ''

  const firstBlock = blocks?.find(
    (block) => block?._type === 'block' && Array.isArray(block?.children)
  )

  if (!firstBlock || !Array.isArray(firstBlock?.children)) return ''

  return firstBlock?.children
    ?.map(
      (child: {
        text?: string
        rate?: string
        year?: string
        george?: string
      }) => child?.text ?? child?.rate ?? child?.year ?? child?.george ?? ''
    )
    ?.join('')
    ?.trim()
}

/**
 * Generates a slug from the input string by removing special characters,
 * converting to lowercase, and replacing spaces with hyphens.
 */
export const sanitizeSlug = (slug?: string) => {
  if (!slug) return ''

  return slug
    .replaceAll(/[-_]+/g, ' ') // treat hyphens/underscores as word separators
    .replaceAll(/[^a-zA-Z0-9\s]/g, '') // strip everything else that isn't alphanumeric or space
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '-') // collapse any whitespace runs into a single hyphen
    .slice(0, 60)
    .replace(/-$/, '') // strip a trailing hyphen left by the slice
}

/**
 * Flattens rich text and generates slug from result
 */
export const slugifyString = (input: Array<PortableTextBlock>) => {
  const flattenedInput = flattenFirstRichTextBlock(input)
  return sanitizeSlug(flattenedInput)
}

/** Preset select for a document previewed by its localized header title. */
export const LocalizedHeaderPreviewSelect = {
  title: 'localizedTitle.en',
  titleMk: 'localizedTitle.mk',
  customLink: 'customLink',
  media: 'icon',
} as const

/**
 * Builds the preview for a nav entry or a link card: the default language's
 * title, else the other one that is filled, with the link as the subtitle.
 */
export function generateLocalizedHeaderPreview({
  title,
  titleMk,
  customLink,
  media,
}: LocalizedHeaderPreviewProps) {
  const printable = (value?: string | Array<PortableTextBlock>) =>
    Array.isArray(value) ? flattenRichText(value) : value

  return {
    title: printable(title) || printable(titleMk) || 'Untitled',
    subtitle: customLink || 'not defined',
    media,
  }
}

/**
 * Checks if a given link is an external or mailto link
 */
export function isExternalLink(link: string) {
  return (
    link?.startsWith('http://') ||
    link?.startsWith('https://') ||
    link?.includes('tel:') ||
    link?.startsWith('mailto:')
  )
}

/** Converts a Sanity image ID into a URL. */
export function convertImageIdToUrl(imageId?: string) {
  if (!imageId) return ''
  if (!imageId?.startsWith('image-')) {
    throw new Error('Invalid image ID format')
  }

  // Remove the 'image-' prefix
  const assetId = imageId?.replace('image-', '')

  // Replace the last '-' before the extension with a '.'
  const lastDashIndex = assetId.lastIndexOf('-')
  const formattedAssetId = `${assetId.substring(
    0,
    lastDashIndex
  )}.${assetId.substring(lastDashIndex + 1)}`

  return `https://cdn.sanity.io/images/${sanityProjectId}/${sanityDataset}/${formattedAssetId}`
}
