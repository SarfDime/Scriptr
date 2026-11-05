import { cn } from '@/lib/common-utils'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'
import { Box, type BoxProps } from '../common/Box'

export type InitialsIconProps = {
  name: string
  color?: ComponentColorPalettes
} & BoxProps

export const InitialsIcon = ({
  name,
  color,
  className,
  ...props
}: InitialsIconProps) => (
  <Box
    className={cn(
      color,
      'aspect-square ui-center shrink-0 overflow-hidden rounded-lg',
      '@container',
      className
    )}
    {...props}
  >
    <Box className='text-[38cqi] leading-none'>
      {name?.slice(0, 2)?.toUpperCase()}
    </Box>
  </Box>
)
