import { cn } from '@/lib/common-utils'
import type { PersonSummary } from '@/types/components/Person.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
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
      <Title as='h3' className='ui-title font-semibold'>
        {title}
      </Title>
      {leader && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>
            {leaderLabel}
          </Text>
          <Text className='ui-body font-medium'>{leader.name}</Text>
          {leader.title && (
            <Text className='ui-caption text-grey-500'>{leader.title}</Text>
          )}
        </Box>
      )}
      {hasDeputies && (
        <Box className='ui-stack gap-2'>
          <Text className='ui-caption font-bold text-grey-500'>
            {deputiesLabel}
          </Text>
          {deputies?.map((deputy) => (
            <Box key={deputy._id} className='ui-stack gap-0.5'>
              <Text className='ui-body font-medium'>{deputy.name}</Text>
              {deputy.title && (
                <Text className='ui-caption text-grey-500'>{deputy.title}</Text>
              )}
            </Box>
          ))}
        </Box>
      )}
      {secretary && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>Secretary</Text>
          <Text className='ui-body'>{secretary}</Text>
        </Box>
      )}
    </Card>
  )
}
