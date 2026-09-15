import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'
import type { NextImageProps } from '../common/NextImage'
import { NextImage } from '../common/NextImage'
import { InitialsIcon } from './InitialsIcon'

export const Avatar = ({
  picture,
  name,
  color,
}: {
  picture?: NextImageProps
  name: string
  color?: ComponentColorPalettes
}) => {
  return (
    <>
      {(picture || name) &&
        (picture ? (
          <NextImage
            {...picture}
            className='rounded-full shrink-0 object-cover h-full aspect-square ui-center p-6'
            fillProp
          />
        ) : (
          <InitialsIcon name={name} color={color} />
        ))}
    </>
  )
}
