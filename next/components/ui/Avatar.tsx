import type { ComponentColorPalettes } from '@/types/component.types'
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
      {picture ? (
        <NextImage
          {...picture}
          className='rounded-full shrink-0 object-cover h-full aspect-square ui-center p-6'
        />
      ) : (
        <InitialsIcon name={name} color={color} />
      )}
    </>
  )
}
