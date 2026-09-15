import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { DetailLink } from '@/components/ui/DetailLink'
import { Divider } from '@/components/ui/Divider'
import { Person } from '@/components/ui/Person'
import { getAcademicPath } from '@/lib/academic-routes'
import { cn } from '@/lib/common-utils'
import type { AdministratorListProps } from '@/types/components/OverviewCard.types'

export const AdministratorList = ({
  administrators,
  layout = 'person',
  detailLinkProps,
  personProps,
  dividerProps: {
    showDivider,
    className: dividerClassName,
    orientation,
    ...restDividerProps
  } = {
    showDivider: true,
    orientation: 'vertical',
  },
  className,
  ...rest
}: AdministratorListProps) => {
  if (administrators.length === 0) return null

  return (
    <Box className={cn('ui-cluster px-2 py-0', className)} {...rest}>
      {administrators.map((admin, index) => (
        <Fragment key={admin._id ?? `${admin.name}-${index}`}>
          {index > 0 && showDivider !== false && (
            <Divider
              orientation={orientation}
              className={cn('border-background-600', dividerClassName)}
              {...restDividerProps}
            />
          )}
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
