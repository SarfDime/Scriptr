import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'
import { cn } from '../../lib/common-utils'
import type { TextProps } from '../typography/Text'
import { Text } from '../typography/Text'

export type BadgeProps = {
  colorPalette?: ComponentColorPalettes
  variant?: 'solid' | 'outline'
} & Omit<TextProps, 'color'>

export const Badge = ({
  children,
  colorPalette = 'cp-gray',
  variant = 'solid',
  className,
  ...rest
}: BadgeProps) => {
  const colorStyle =
    variant === 'solid' ? colorPalette : cn(colorPalette, 'bg-transparent')

  return (
    <Text as='span' {...rest} className={cn('ui-badge', colorStyle, className)}>
      {children}
    </Text>
  )
}
