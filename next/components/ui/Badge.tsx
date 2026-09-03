import { cn } from '../../lib/common-utils'
import type { ComponentColorPalettes } from '../../types/component.types'
import type { TextProps } from '../typography/Text'
import { Text } from '../typography/Text'

export type BadgeProps = {
  colorPalette?: ComponentColorPalettes
  variant?: 'solid' | 'outline'
} & TextProps

export const Badge = ({
  children,
  colorPalette = 'gray',
  variant = 'solid',
  className,
  ...rest
}: BadgeProps) => {
  const colorStyle =
    variant === 'solid'
      ? colorPalette
      : cn(colorPalette, 'border border-currentColor')

  return (
    <Text
      as='span'
      {...rest}
      className={cn(
        'ui-badge inline-flex items-center px-2.5 py-0.5 font-medium text-xs',
        colorStyle,
        className
      )}
    >
      {children}
    </Text>
  )
}
