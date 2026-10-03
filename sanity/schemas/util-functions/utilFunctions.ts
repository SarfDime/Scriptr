import type { PortableTextBlock } from 'sanity'
import type { StructureBuilder } from 'sanity/structure'
import { Iframe } from 'sanity-plugin-iframe-pane'
import type {
  LinkSelectorPreviewProps,
  PreviewPrepareProps,
} from '../../types/common.types'
import type { Doc } from '../../types/schema-prop.types'

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
export const flattenFirstRichTextBlock = (
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

// The url that will be passed to the Iframe plugin
const iFrameUrl = (
  { slug }: { slug: string } // TODO: Change when staging is live
) =>
  `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://staging-tontine-com.netlify.app'}/api/draft?secret=PREVIEWMODE&slug=${slug}`

/**
 * Generates the editing document slug needed for the iFrameUrl
 */
export const getDocumentSlug = ({ doc }: { doc: Doc }) => {
  const typeSlugMap: Record<string, string> = {
    newsPost: 'news',
    researchPost: 'research',
    videoPost: 'videos',
    blogPost: 'blog',
  }

  const prefix = typeSlugMap[doc?._type || '']
  const slugPath = prefix
    ? `/${prefix}/${doc?.slug?.current}`
    : `/${doc?.pageSlug?.current ?? ''}`

  return iFrameUrl({ slug: slugPath })
}

/**
 * Builds the frame with the content that we are trying to show on the frame.
 * Pass the StructureBuilder, url of what you want to embed, and the title of the action button
 */
export const iframeBuilder = (s: StructureBuilder, title: string) => {
  return s.view
    .component(Iframe)
    .options({
      url: (doc: Doc) =>
        getDocumentSlug({
          doc,
        }),
      reload: {
        button: true,
      },
    })
    .title(title)
}

/** * Converts minutes and seconds to a string
 * Adds a leading zero if the number of minutes or seconds is less than 10
 */
export function formatMinutesSeconds(minutes: number, seconds: number) {
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
  return `${formattedMinutes}:${formattedSeconds}`
}

/**
 * Converts seconds to minutes and seconds
 */
export function convertTimeToMinutesSeconds(seconds: number) {
  if (typeof seconds !== 'number') return null

  const minutes = Math.floor(seconds / 60) // Get the whole number of minutes
  const secondsLeft = seconds % 60 // Get the remaining seconds

  return formatMinutesSeconds(minutes, secondsLeft)
}

/** Preset for the Link Selector preview select */
export const LinkSelectorPreviewSelect: Record<
  keyof LinkSelectorPreviewProps,
  string
> = {
  title: 'title',
  pageSlug: 'allPages.pageSlug.current',
  pageRef: 'allPages._id',
  slug: 'allPages.slug.current',
  sectionSlug: 'allPageSections.slug.current',
  customLink: 'customLink',
  variant: 'buttonColorVariant',
  linkType: 'linkType',
  media: 'icon',
} as const

/**
 * Generates a preview object for the Link Selector schema type.
 *
 * The object contains the title of the link, a subtitle that is a path to the link, and an optional media object.
 *
 * The path is determined as follows:
 *   - If customLink is set, it is used as the path.
 *   - If pageSlug is set, it is used as the path (optionally preceded by pageType), optionally followed by a section anchor.
 *   - If pageRef is set, the path is set to '/'.
 *   - Otherwise, the path is set to 'not defined'.
 */
export function generateLinkSelectorPreview({
  title,
  pageSlug,
  slug,
  pageRef,
  sectionSlug,
  customLink,
  media,
}: LinkSelectorPreviewProps) {
  const getSubtitlePath = (): string => {
    if (customLink) {
      return customLink
    }

    const getSlugString = (val: typeof pageSlug) =>
      val && typeof val === 'object' && 'current' in val ? val.current : val

    const resolvedSlug = getSlugString(pageSlug) || getSlugString(slug)

    if (resolvedSlug || sectionSlug) {
      const pathParts = [resolvedSlug].filter(Boolean)

      let path = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '/'

      if (sectionSlug) {
        path += `#${sectionSlug}`
      }

      return path
    }

    if (pageRef) {
      return '/'
    }

    return 'not defined'
  }

  return {
    title: Array.isArray(title) ? flattenRichText(title) : title,
    subtitle: getSubtitlePath(),
    media,
  }
}
/** Generates a preview object for a section. */
export function sectionPreview({
  title,
  fallbackTitle,
  subtitle,
  media,
  sectionImage,
}: PreviewPrepareProps) {
  const getFirstLine = (
    value: string | Array<PortableTextBlock> | undefined
  ) => {
    if (!Array.isArray(value)) return value

    return flattenFirstRichTextBlock(value)
  }
  const flattenedTitle = getFirstLine(title)
  const flattenedFallbackTitle = getFirstLine(fallbackTitle)

  const flattenedSubtitle = getFirstLine(subtitle)

  const combinedTitle = flattenedTitle ?? flattenedFallbackTitle

  return {
    title: combinedTitle,
    subtitle: flattenedSubtitle,
    media: media ?? sectionImage,
  }
}

// More flexible version with default values
export const createSectionPreview = ({
  title = 'title',
  fallbackTitle = 'stringTitle',
  subtitle = 'slug.current',
  media = 'icon',
  videoThumbnail = 'videoThumbnail',
  sectionImage = 'sectionImage',
  sectionVideoPlayBackId = 'sectionVideo.asset.playbackId',
} = {}) => ({
  select: {
    title,
    fallbackTitle,
    subtitle,
    media,
    sectionImage,
    videoThumbnail,
    sectionVideoPlayBackId,
  },
  prepare: sectionPreview,
})

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
  const projectId = 'REDACTED_SANITY_PROJECT_ID' // TODO: Replace with constant from environment or config, along with every occurrence
  const dataset = 'production' // TODO: Replace with constant from environment or config

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

  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${formattedAssetId}`
}
