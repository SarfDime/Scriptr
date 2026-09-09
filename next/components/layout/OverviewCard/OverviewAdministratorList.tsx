import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { Divider } from '@/components/ui/Divider'
import { Person } from '@/components/ui/Person'
import type { AdministratorListProps } from '@/types/components/OverviewCard.types'

export const AdministratorList = ({
  administrators,
}: AdministratorListProps) => {
  if (administrators.length === 0) return null

  return (
    <Box className='ui-cluster px-2 py-0'>
      {administrators.map((admin, index) => (
        <Fragment key={admin._id ?? `${admin.name}-${index}`}>
          {index > 0 && (
            <Divider orientation='vertical' className='border-background-600' />
          )}
          <Person
            title={admin.title}
            name={admin.name}
            descriptionProps={{ className: 'text-white/70' }}
            nameProps={{ className: 'text-white' }}
            titleProps={{ className: 'text-white/70' }}
          />
        </Fragment>
      ))}
    </Box>
  )
}
