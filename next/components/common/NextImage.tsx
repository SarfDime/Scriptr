'use client'

import { IMAGE_QUALITY } from '@shared/config/next-constants'
import type { SanityImageType } from '@shared/types/sanity-transform.types'
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { SkeletonBoxProps } from '@/types/components/Skeleton.types'
import type {
  ImageObjectFitType,
  ImageObjectPositionType,
} from '../../../shared/types/common.types'
import { cn, urlFor } from '../../lib/common-utils'
import { Skeleton } from '../ui/skeleton/Skeleton'

type NextImageBaseProps = {
  src?: string
  className?: string
  priority?: boolean
  objectFitProp?: ImageObjectFitType
  objectPositionProp?: ImageObjectPositionType
  imageProps?: Omit<ImageProps, 'src' | 'alt' | 'sizes'>
  isLoadingExt?: boolean
} & Omit<SkeletonBoxProps, 'src' | 'alt'> & {
    quality?: ImageProps['quality']
  } & Partial<SanityImageType>

export type NextImageProps =
  | (NextImageBaseProps & {
      fillProp: true
      sizes: ImageProps['sizes']
    })
  | (NextImageBaseProps & {
      fillProp?: false
      sizes?: ImageProps['sizes']
    })

/** `NextImage` - Renders an image with optional skeleton loading and custom styling.
 *
 * Handles the display of images with support for lazy loading, skeleton loading state,
 * and various styling options.
 *
 * Functionality:
 * - Shows a skeleton loader while the image is loading by default (optional).
 * - Renders the image with specified styles and properties.
 * - Supports lazy loading and priority loading.
 * - Allows customization of object fit and position.
 */
export function NextImage({
  alt,
  src,
  className,
  fillProp,
  priority,
  objectPositionProp,
  objectFitProp,
  imageProps,
  asset,
  crop,
  hotspot,
  quality,
  isLoadingExt,
  sizes,
  ...rest
}: NextImageProps) {
  const ui = useUIStrings()
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {asset || src ? (
        <Skeleton
          loading={isLoadingExt ?? isLoading}
          {...rest}
          className={cn(
            `relative h-full ${!isLoadingExt && !isLoading && 'rounded-none'}`,
            priority && 'before:duration-500',
            className
          )}
        >
          <Image
            {...imageProps}
            className={cn(imageProps?.className)}
            style={{
              objectFit: objectFitProp ?? 'contain',
              objectPosition: objectPositionProp ?? 'center',
            }}
            quality={quality ?? IMAGE_QUALITY.MAXIMUM}
            alt={alt || ui.general.dataUnavailable}
            src={src || urlFor({ asset, crop, hotspot }).url()}
            fill={Boolean(fillProp)}
            sizes={sizes}
            priority={priority}
            onLoad={() => setIsLoading(false)}
          />
        </Skeleton>
      ) : (
        <div />
      )}
    </>
  )
}
