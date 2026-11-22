import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { DetailLink } from '@/components/ui/DetailLink'
import { Person } from '@/components/ui/Person'
import { cn } from '@/lib/common-utils'
import type { AdministratorListProps } from '@/types/components/OverviewCard.types'
import { Divider } from './Divider'

export const AdministratorList = ({
  administrators,
  layout = 'person',
  dividerAfter,
  dividerProps,
  detailLinkProps,
  personProps,
  className,
  ...rest
}: AdministratorListProps) => {
  if (administrators.length === 0) return null

  return (
    <Box className={cn('ui-cluster px-2 py-0', className)} {...rest}>
      {administrators.map((admin, index) => (
        <Fragment key={admin._id ?? `${admin.name}-${index}`}>
          {layout === 'detailLink' && admin.href && (
            <DetailLink
              {...detailLinkProps}
              href={admin.href}
              label={admin.title}
              value={admin.name}
            />
          )}
          {layout === 'person' && (
            <Person title={admin.title} name={admin.name} {...personProps} />
          )}
          {index === dividerAfter && index < administrators.length - 1 && (
            <Divider {...dividerProps} aria-hidden='true' />
          )}
        </Fragment>
      ))}
    </Box>
  )
}
