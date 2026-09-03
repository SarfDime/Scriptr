import { IMAGE_QUALITY } from '@shared/config/next-constants'
import { IMAGE_SIZES } from '@/styles/style'
import type { SanityImageType } from '@/types/common.types'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { cn, convertToPlainText } from '../../lib/common-utils'
import type { BoxProps } from './Box'
import { NextLink, type NextLinkProps } from './NextLink'
import { SanityImage, type SanityImageProps } from './SanityImage'

type LinkWithImageProps = {
  href: string
  linkImage: SanityImageType
  comingSoon?: boolean
  linkTitle?: PortableTextType
  hideExternalIcon?: boolean
  imageProps?: SanityImageProps
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
      <SanityImage
        {...linkImage}
        fillProp
        {...imageProps}
        skeletonProps={{
          className: cn('h-12 w-36', imageProps?.skeletonProps?.className),
        }}
        quality={IMAGE_QUALITY.MAXIMUM}
        sizes={IMAGE_SIZES.NEXTJS_IMAGE_DEFAULT_SIZE_PROPERTY}
      />
    </NextLink>
  )
}
