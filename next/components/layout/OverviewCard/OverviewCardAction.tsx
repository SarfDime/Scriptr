import { NextLink } from '@/components/common/NextLink'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/common-utils'
import type { OverviewCardActionProps } from '@/types/components/OverviewCard.types'

export const OverviewCardAction = ({ action }: OverviewCardActionProps) => {
  const { icon, label, href, colorPalette, hideExternalIcon } = action

  if (href) {
    return (
      <NextLink
        href={href}
        className={cn('ui-badge-fixed grow ui-caption', colorPalette)}
        hideExternalIcon={hideExternalIcon}
      >
        {icon}
        {label}
      </NextLink>
    )
  }

  return (
    <Badge colorPalette={colorPalette} className='ui-badge-fixed grow'>
      {icon}
      {label}
    </Badge>
  )
}
