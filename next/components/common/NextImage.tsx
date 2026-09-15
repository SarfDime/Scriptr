'use client'

import { IMAGE_QUALITY } from '@shared/config/next-constants'
import type { SanityImageType } from '@shared/types/sanity-transform.types'
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import type { SkeletonBoxProps } from '@/types/components/Skeleton.types'
import type {
  ImageObjectFitType,
  ImageObjectPositionType,
} from '../../../shared/types/common.types'
import { cn, urlFor } from '../../lib/common-utils'
import { Skeleton } from '../ui/skeleton/Skeleton'

export type NextImageProps = {
  src?: string
  className?: string
  fillProp?: boolean
  priority?: boolean
  objectFitProp?: ImageObjectFitType
  objectPositionProp?: ImageObjectPositionType
  imageProps?: Omit<ImageProps, 'src' | 'alt'>
  cornerRadius?: number
  rounded?: number
  isLoadingExt?: boolean
  sizes?: ImageProps['sizes']
} & Omit<SkeletonBoxProps, 'src' | 'alt'> & {
    quality?: ImageProps['quality']
  } & Partial<SanityImageType>

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
  cornerRadius,
  rounded,
  asset,
  crop,
  hotspot,
  quality,
  isLoadingExt,
  sizes,
  ...rest
}: NextImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {asset || src ? (
        <Skeleton
          loading={isLoadingExt ?? isLoading}
          {...rest}
          className={cn(
            `relative z-0 h-full w-full ${!isLoadingExt && !isLoading && 'rounded-none'}`,
            priority && 'before:duration-500',
            className,
            rounded && cornerRadius && 'roundedImage'
          )}
          style={{
            '--cornerRadius': rounded ? `${cornerRadius}%` : '0',
          }}
        >
          <Image
            {...imageProps}
            className={cn(
              imageProps?.className,
              `object-${
                objectFitProp ?? 'contain'
              } object-${objectPositionProp ?? 'center'}`
            )}
            quality={quality ?? IMAGE_QUALITY.MAXIMUM}
            alt={alt || 'Data unavailable'}
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
