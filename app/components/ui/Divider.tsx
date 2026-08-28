import { cn } from '../../lib/common-utils'
import { Box, type BoxProps } from '../common/Box'

type DividerProps = {
  variant?: 'solid' | 'dashed'
  orientation?: 'horizontal' | 'vertical'
} & BoxProps

/** `Divider` is used to render a divider line with optional orientation and styling */
export function Divider({
  variant = 'solid',
  orientation = 'horizontal',
  className,
  ...rest
}: DividerProps) {
  const baseStyles = 'border-gray-300 border-0'
  const variantStyles = variant === 'dashed' ? 'border-dashed' : 'border-solid'
  const orientationStyles =
    orientation === 'horizontal' ? 'border-t w-full' : 'border-l h-full'

  return (
    <Box
      className={cn(baseStyles, variantStyles, orientationStyles, className)}
      {...rest}
    />
  )
}
