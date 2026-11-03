import ArrowLeft from '@sanity/icons/ArrowLeft'
import ChevronLeft from '@sanity/icons/ChevronLeft'
import DoubleChevronLeft from '@sanity/icons/DoubleChevronLeft'
import { NextLink, type NextLinkBaseProps } from '@/components/common/NextLink'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { Badge, type BadgeProps } from '../ui/Badge'

const BACK_LINK_ICONS = {
  oneBack: <ChevronLeft />,
  twoBack: <DoubleChevronLeft />,
  threeBack: <ArrowLeft />,
} as const

export type BackLinkProps = {
  badgeProps?: BadgeProps
  label: string
  backLevel?: keyof typeof BACK_LINK_ICONS
} & Omit<NextLinkBaseProps, 'children'>

export const BackLink = ({
  badgeProps,
  label,
  backLevel = 'oneBack',
  ...rest
}: BackLinkProps) => {
  const colorPalette =
    badgeProps?.colorPalette ??
    getColorPalette({ value: label, variant: 'int' })
  return (
    <NextLink {...rest}>
      <Badge
        {...badgeProps}
        colorPalette={colorPalette}
        className={cn('ui-center pl-0', badgeProps?.className)}
      >
        {BACK_LINK_ICONS[backLevel]}
        {label}
      </Badge>
    </NextLink>
  )
}
