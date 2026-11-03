import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { IMAGE_SIZES } from '@/styles/style'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'
import type { NextImageProps } from '../common/NextImage'
import { NextImage } from '../common/NextImage'
import { InitialsIcon, type InitialsIconProps } from './InitialsIcon'

export const Avatar = ({
  picture,
  name,
  color,
  initialsIconProps,
  className,
}: {
  picture?: NextImageProps
  name: string
  color?: ComponentColorPalettes
  initialsIconProps?: Omit<InitialsIconProps, 'name' | 'color'>
  className?: string
}) => {
  const accent = color ?? getColorPalette({ value: name })
  return (
    <>
      {(picture || name) &&
        (picture ? (
          <NextImage
            objectFitProp='cover'
            fillProp
            sizes={IMAGE_SIZES.AVATAR}
            alt={name}
            {...picture}
            imageProps={{
              ...picture.imageProps,
            }}
            className={cn(
              'rounded-md h-full aspect-square ui-center',
              picture?.className,
              className
            )}
          />
        ) : (
          <InitialsIcon
            {...initialsIconProps}
            name={name}
            color={accent}
            className={cn(
              'h-full aspect-square ui-center',
              initialsIconProps?.className,
              className
            )}
          />
        ))}
    </>
  )
}
