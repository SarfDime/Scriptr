import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { DetailLink } from '@/components/ui/DetailLink'
import { Person } from '@/components/ui/Person'
import { getAcademicPath } from '@/lib/academic-routes'
import { cn } from '@/lib/common-utils'
import type { AdministratorListProps } from '@/types/components/OverviewCard.types'

export const AdministratorList = ({
  administrators,
  layout = 'person',
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
          {layout === 'detailLink' && (
            <DetailLink
              {...detailLinkProps}
              key={admin._id}
              href={getAcademicPath({
                type: 'professor',
                professorSlug: admin._id,
              })}
              label={admin.title}
              value={admin.name ?? 'daw'}
            />
          )}
          {layout === 'person' && (
            <Person title={admin.title} name={admin.name} {...personProps} />
          )}
        </Fragment>
      ))}
    </Box>
  )
}
