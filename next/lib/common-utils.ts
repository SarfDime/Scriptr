import {
  createImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'
import type {
  LinkSelectorProps,
  Summarizable,
} from '@shared/types/common.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { type ClassValue, clsx } from 'clsx'
import { toPlainText } from 'next-sanity'
import { twMerge } from 'tailwind-merge'
import type { EntityCardStat } from '@/components/common/EntityCard'
import { isProd } from '@/config/env'
import { studySiteHost } from '@/lib/study-origin'
import { client } from '@/sanity/lib/client'
import type { PersonSummary } from '@/types/components/Person.types'
import type { ComponentPlacement } from '../types/component.types'

/**
 * Builds an `EntityCard` stats array from a label→value record, dropping any
 * entries whose value is `undefined` (e.g. optional counts not yet computed).
 * Insertion order is preserved, so callers control display order via key order.
 */
export const compactStats = (
  values: Record<string, number | string | undefined>
): Array<EntityCardStat> =>
  Object.entries(values)
    .filter(
      (entry): entry is [string, number | string] => entry[1] !== undefined
    )
    .map(([label, value]) => ({ label, value }))

type SummaryTarget = Summarizable & { slug?: string | null }

/**
 * Normalizes single entities or arrays of entities into PersonSummary objects,
 * safely filtering out nullish or incomplete records. `getHref` gives each
 * summary the link it should open (an entity's own page, not a shared one).
 */
export function createPersonSummaries(
  ...entries: Array<{
    target: SummaryTarget | Array<SummaryTarget> | null | undefined
    title: string
    getHref?: (item: SummaryTarget) => string
  }>
): Array<PersonSummary> {
  return entries.flatMap(({ target, title, getHref }) => {
    if (!target) return []

    const items = Array.isArray(target) ? target : [target]

    return items.flatMap((item) => {
      if (!item?._id || !item?.name) return []
      return {
        _id: item._id,
        name: item.name,
        title,
        ...(getHref && { href: getHref(item) }),
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
export const convertToPlainText = ({
  value,
}: {
  value?: PortableTextValue
}) => {
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

/** Clamps `number` into `[min, max]`. */
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
 * Resolves the destination of a nav item or button.
 *
 * TODO: resolve academic/page links here once the Sanity link selector supports
 * them again. Custom paths are the only destination for now.
 */
export const generateSlug = (slugData: LinkSelectorProps) =>
  slugData?.customLink ?? '/'

// Create an image URL builder using the client
const builder = createImageUrlBuilder(client)

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
 * Checks if a given link leaves the Scriptr sites. An absolute URL counts as
 * external only when its host is neither the catalog nor one of the studies:
 * every academic page inside a study is addressed by its own host, and those
 * are still ours — opening them in a new tab with an external-link icon would
 * be wrong.
 */
function externalLink(link: string) {
  if (link?.includes('tel:') || link?.startsWith('mailto:')) {
    return { isExternal: true, attributes: externalAttributes }
  }

  if (link?.startsWith('http://') || link?.startsWith('https://')) {
    return isOurAddress(link)
      ? { isExternal: false, attributes: null }
      : { isExternal: true, attributes: externalAttributes }
  }

  return { isExternal: false, attributes: null }
}

const externalAttributes = {
  target: '_blank',
  rel: 'nofollow noopener noreferrer',
}

/** `<study>.<site host>` or the site host itself — the hosts this app serves. */
function isOurAddress(link: string): boolean {
  const siteHost = studySiteHost()
  if (!siteHost) return false

  try {
    const { host } = new URL(link)
    const candidate = host.replace(/^www\./, '')
    return candidate === siteHost || candidate.endsWith(`.${siteHost}`)
  } catch {
    return false
  }
}

export { externalLink }
