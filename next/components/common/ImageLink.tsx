import { IMAGE_QUALITY } from '@shared/config/next-constants'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { SanityImageType } from '@shared/types/sanity-transform.types'
import { IMAGE_SIZES } from '@/styles/style'
import { cn, convertToPlainText } from '../../lib/common-utils'
import type { BoxProps } from './Box'
import { NextImage, type NextImageProps } from './NextImage'
import { NextLink, type NextLinkProps } from './NextLink'

type LinkWithImageProps = {
  href: string
  linkImage: SanityImageType
  comingSoon?: boolean
  linkTitle?: PortableTextValue
  hideExternalIcon?: boolean
  imageProps?: NextImageProps
  linkProps?: NextLinkProps
  comingSoonProps?: BoxProps
} & Omit<BoxProps, 'title'>

/** `ImageLink` is a component that displays an image wrapped within a link.
 * It uses the `NextLink` component to render the link and the `SanityImage`
 * component to render the image.
 */
export const ImageLink = ({
  href,
  linkImage,
  linkTitle,
  hideExternalIcon,
  imageProps,
  linkProps,
}: LinkWithImageProps) => {
  return (
    <NextLink
      href={href}
      hideExternalIcon={hideExternalIcon}
      {...linkProps}
      className={cn('duration-200 lg:hover:opacity-80', linkProps?.className)}
      aria-label={convertToPlainText({ value: linkTitle })}
    >
      <NextImage
        {...linkImage}
        fillProp
        {...imageProps}
        className={cn('h-12 w-36', imageProps?.className)}
        quality={IMAGE_QUALITY.MAXIMUM}
        sizes={IMAGE_SIZES.LINK_LOGO}
      />
    </NextLink>
  )
}
