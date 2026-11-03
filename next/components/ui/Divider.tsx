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
  // The orientation paints the groove; the line is tinted through `--divider-line`.
  const orientationStyles =
    orientation === 'horizontal'
      ? 'ui-divider-h w-full'
      : 'ui-divider-v h-full min-h-4'
  // A dashed line cannot come out of the groove gradient, so it falls back to a
  // border — which has to beat the width/background the groove sets.
  const variantStyles =
    variant === 'dashed'
      ? cn(
          'h-px! border-dashed border-(--divider-line)',
          orientation === 'horizontal' ? 'border-t!' : 'border-l!',
          'bg-none!'
        )
      : ''
  const colorSchemeStyles =
    colorScheme === 'dark' ? '' : '[--divider-line:var(--color-grey-300)]'

  return (
    <Box
      className={cn(
        baseStyles,
        orientationStyles,
        variantStyles,
        colorSchemeStyles,
        className
      )}
      {...rest}
    />
  )
}
