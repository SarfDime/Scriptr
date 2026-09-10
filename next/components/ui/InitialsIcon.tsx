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
      'h-full aspect-square rounded-2xl ui-center p-6',
      className
    )}
    {...props}
  >
    {name?.slice(0, 2)?.toUpperCase()}
  </Box>
)
