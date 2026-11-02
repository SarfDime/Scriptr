import { cn } from '../../lib/common-utils'
import { Box, type BoxProps } from '../common/Box'

export type DividerProps = {
  variant?: 'solid' | 'dashed'
  orientation?: 'horizontal' | 'vertical'
  colorScheme?: 'dark' | 'light'
} & BoxProps

/** `Divider` is used to render a divider line with optional orientation and styling */
export function Divider({
  variant = 'solid',
  orientation = 'horizontal',
  className,
  colorScheme = 'dark',
  ...rest
}: DividerProps) {
  const baseStyles = 'ui-divider'
  const variantStyles = variant === 'dashed' ? 'border-dashed' : 'border-solid'
  const orientationStyles =
    orientation === 'horizontal' ? 'border-t w-full' : 'border-l h-full min-h-4'
  const colorSchemeStyles =
    colorScheme === 'dark' ? 'ui-above-inside p-0' : 'border-grey-300'

  return (
    <Box
      className={cn(
        baseStyles,
        variantStyles,
        orientationStyles,
        colorSchemeStyles,
        className
      )}
      {...rest}
    />
  )
}
