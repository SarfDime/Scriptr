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
      // The initials scale with the box, so one component serves a 24px header
      // avatar and a 64px profile one. The query belongs on the box and the
      // size on the text: `cqi` on the container itself resolves against the
      // *next* container up and rendered ~114px letters in a 24px circle.
      '[container-type:inline-size]',
      className
    )}
    {...props}
  >
    <Box className='text-[38cqi] leading-none'>
      {name?.slice(0, 2)?.toUpperCase()}
    </Box>
  </Box>
)
