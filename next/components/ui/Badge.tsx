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
      ? `cp-${colorPalette}`
      : cn(`cp-${colorPalette}`, 'border border-currentColor')

  return (
    <Text
      as='span'
      {...rest}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 font-medium text-xs rounded-xl',
        colorStyle,
        className
      )}
    >
      {children}
    </Text>
  )
}
