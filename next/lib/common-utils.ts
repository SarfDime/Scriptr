import {
  createImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'
import { type ClassValue, clsx } from 'clsx'
import { toPlainText } from 'next-sanity'
import path from 'path'
import { twMerge } from 'tailwind-merge'
import { isProd } from '@/config/env'
import type { LinkSelectorProps, Summarizable } from '@/types/common.types'
import type { PersonSummary } from '@/types/components/Person.types'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { client } from '../sanityClient'
import type { ComponentPlacement } from '../types/component.types'

/** Formats a given date into a human-readable string indicating how long ago it was updated. */
export const formatUpdated = (date: Date) => {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/**
 * Normalizes single entities or arrays of entities into PersonSummary objects,
 * safely filtering out nullish or incomplete records.
 */
export function createPersonSummaries(
  ...entries: Array<{
    target: Summarizable | Array<Summarizable> | null | undefined
    title: string
  }>
): Array<PersonSummary> {
  return entries.flatMap(({ target, title }) => {
    if (!target) return []

    const items = Array.isArray(target) ? target : [target]

    return items.flatMap((item) => {
      if (!item?._id || !item?.name) return []
      return {
        _id: item._id,
        name: item.name,
        title,
      }
    })
  })
}

/** Gets draft mode value; disabled in production builds */
export const getDraftMode = async (
  draftMode: () => Promise<{ isEnabled?: boolean }>
) => {
  if (isProd) return false
  const { isEnabled } = await draftMode()
  return isEnabled ?? false
}

/** A utility function that takes a localized string or content object and returns a plain text version of it. */
export const convertToPlainText = ({ value }: { value?: PortableTextType }) => {
  if (!value) return ''

  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return toPlainText(value)
  }

  return value ?? ''
}

/** Merges class names using clsx and tailwind-merge. */
export const cn = (...inputs: Array<ClassValue>) => twMerge(clsx(inputs))

/** Given a placement type, returns the appropriate Tailwind CSS classes for positioning. */
export const getPlacementClasses = ({
  placement,
  offsetY,
  offsetX,
}: ComponentPlacement) => {
  switch (placement) {
    case 'left':
      return cn('right-[unset] left-0', offsetX && offsetX)
    case 'center':
      return cn(
        'left-1/2 -translate-x-1/2 transform',
        offsetX && offsetX,
        offsetY && offsetY
      )
    case 'right':
      return cn('right-0 left-[unset]', offsetX && offsetX)
    default:
      return ''
  }
}

/**
 * Detects a device type depending on the screen size.
 *
 * @note This is NOT an accurate way to detect user is using a certain device.
 */
export const detectDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
  let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'

  if (typeof window !== 'undefined') {
    if (window?.innerWidth >= 992) {
      // Desktops and laptops typically have screens wider than 992px
      deviceType = 'desktop'
    } else if (window?.innerWidth >= 768 && window?.innerWidth < 992) {
      // Tablets typically have screens between 768px and 991px wide
      deviceType = 'tablet'
    } else {
      // Mobile devices typically have screens narrower than 767px
      deviceType = 'mobile'
    }
  }
  return deviceType
}

/** Gets the possible numbers in range */
export const numberWithinRange = (
  number: number,
  min: number,
  max: number
): number => Math.min(Math.max(number, min), max)

/** Replaced white spaces with custom string or with "-" */
export function replaceString({
  str,
  replace,
  replaceWith,
}: {
  str: string
  replace: string
  replaceWith: string
}) {
  if (str) return str?.replace(new RegExp(replace, 'g'), `${replaceWith}`)
  return str
}

/**
 * Joins an array of segments into a single path string, with optional leading and ending trailing slash.
 *
 * - `segments` - An array of segments to join into a path.
 * - `leadingSlash` - Whether to include a leading slash in the path. Defaults to false.
 * - `endsWithSlash` - Whether to include a trailing slash at the end of the path. Defaults to false.
 */
export const generatePath = ({
  segments,
  leadingSlash = false,
  endsWithSlash = false,
}: {
  segments: Array<string>
  leadingSlash?: boolean
  endsWithSlash?: boolean
}): string => {
  const route = segments?.filter(Boolean).join('/')

  return path.join(leadingSlash ? '/' : '', route, endsWithSlash ? '/' : '')
}

/** Generates a slug based on the provided slug data. */
export const generateSlug = (slugData: LinkSelectorProps) => {
  if (slugData?.linkType === 'custom') return slugData?.customLink

  return generatePath({
    segments: [
      slugData?.pageSlug?.current,
      slugData?.sectionSlug?.current && `#${slugData?.sectionSlug?.current}`,
    ].filter(Boolean),
  })
}

// Create an image URL builder using the client
const builder = createImageUrlBuilder(client)

// Export a function that can be used to get image URLs
export function urlFor(source?: SanityImageSource) {
  if (!source) return { url: () => '' }
  return builder.image(source)
}

export function getImagePath({
  imagePath,
  crop,
  hotspot,
}: {
  imagePath: string
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
}): string {
  if (!imagePath) return ''

  const url = new URL(imagePath)

  // Handle crop
  if (crop) {
    const params = new URLSearchParams({
      rect: `${Math.floor(crop.left * 100)},${Math.floor(crop.top * 100)},${Math.floor(
        (1 - crop.right - crop.left) * 100
      )},${Math.floor((1 - crop.bottom - crop.top) * 100)}`,
    })
    url.search = params.toString()
  }

  // Handle hotspot
  if (hotspot) {
    const params = new URLSearchParams(url.search)
    params.set('fp-x', hotspot.x.toString())
    params.set('fp-y', hotspot.y.toString())
    url.search = params.toString()
  }

  return url.toString()
}

/**
 * Returns an object with the specified attribute name and value if the condition is true, otherwise returns an empty object.
 */
export function getAttribute<T extends string, U>(
  condition: boolean,
  attributeName: T,
  attributeValue: U
) {
  return condition && attributeValue
    ? ({ [attributeName]: attributeValue } as { [K in T]: U })
    : undefined
}

/** Function that converts date to client locale */
export const convertDateToClientLocale = (date: string) => {
  const convertedDate = new Date(date).toLocaleDateString('en-Us', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  if (convertedDate === 'Invalid Date') return undefined
  return convertedDate
}

/**
 * Checks if a given link is an external or mailto link
 */
function externalLink(link: string) {
  const isExternal =
    link?.startsWith('http://') ||
    link?.startsWith('https://') ||
    link?.includes('tel:') ||
    link?.startsWith('mailto:')
  return {
    isExternal,
    attributes: isExternal
      ? { target: '_blank', rel: 'nofollow noopener noreferrer' }
      : null,
  }
}

/** Generates a random string */
const generateRandomString = () => Math.random().toString(36).substring(2, 7)

export { externalLink, generateRandomString }
