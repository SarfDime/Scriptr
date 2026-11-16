import { cn } from '../../lib/common-utils'
import { Box, type BoxProps } from '../common/Box'

export type DividerProps = {
  variant?: 'solid' | 'dashed'
  orientation?: 'horizontal' | 'vertical'
  colorScheme?: 'dark' | 'light'
} & BoxProps

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
          // The dashed line is a border, so the art and the tint overlay (both
          // pseudo/background paint) are switched off or they would cover it.
          'bg-none! before:hidden after:hidden'
        )
      : ''
  // `--divider-tint` is painted over the ice silhouette, so it carries an
  // alpha: an opaque colour would flatten the ridge instead of tinting it.
  const colorSchemeStyles =
    colorScheme === 'dark'
      ? ''
      : '[--divider-line:var(--color-grey-300)] [--divider-tint:color-mix(in_srgb,var(--color-grey-300)_65%,transparent)]'

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
