import { cn } from '@/lib/common-utils'
import type { PersonSummary } from '@/types/components/Person.types'
import { Box } from '../common/Box'
import { SectionHeader } from '../common/SectionHeader'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'

export type AdministrationCardProps = {
  title?: string
  leaderLabel?: string
  leader?: PersonSummary
  deputiesLabel?: string
  deputies?: Array<PersonSummary>
  secretary?: string
  className?: string
}

export const AdministrationCard = ({
  title = 'Administration',
  leaderLabel = 'Dean',
  leader,
  deputiesLabel = 'Vice Deans',
  deputies,
  secretary,
  className,
}: AdministrationCardProps) => {
  const hasDeputies = Boolean(deputies && deputies.length > 0)
  if (!leader && !hasDeputies && !secretary) {
    return null
  }

  return (
    <Card className={cn('p-6 ui-stack gap-4', className)}>
      <SectionHeader as='h3' title={title} />
      {leader && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>{leaderLabel}</Text>
          <Text className='ui-body-strong'>{leader.name}</Text>
          {leader.title && <Text className='ui-caption'>{leader.title}</Text>}
        </Box>
      )}
      {hasDeputies && (
        <Box className='ui-stack gap-2'>
          <Text className='ui-label'>{deputiesLabel}</Text>
          {deputies?.map((deputy) => (
            <Box key={deputy._id} className='ui-stack gap-0.5'>
              <Text className='ui-body-strong'>{deputy.name}</Text>
              {deputy.title && (
                <Text className='ui-caption'>{deputy.title}</Text>
              )}
            </Box>
          ))}
        </Box>
      )}
      {secretary && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>Secretary</Text>
          <Text className='ui-body'>{secretary}</Text>
        </Box>
      )}
    </Card>
  )
}
