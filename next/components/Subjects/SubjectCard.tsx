import Menu from '@sanity/icons/Menu'
import { cn, paletteClass } from '@/lib/common-utils'
import type { SubjectCardProps } from '@/types/components/Subjects.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'

export const SubjectCard = ({ subject }: SubjectCardProps) => {
  return (
    <Card className={'ui-stack gap-4'}>
      <Card.Body className='flex items-start gap-3 p-0'>
        <Box
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border ui-label',
            paletteClass(subject.color)
          )}
        >
          {subject.name.slice(0, 2).toUpperCase()}
        </Box>
        <Box className='ui-stack min-w-0 gap-1'>
          <Text className='ui-body text-fg-700'>{subject.name}</Text>
          <Text className='ui-caption'>{subject.code}</Text>
        </Box>
        <Menu className='ml-auto text-fg-400' />
      </Card.Body>

      <Card.Footer className='ui-cluster w-full justify-between pt-2'>
        <Box className='ui-stack gap-2'>
          <Text className='ui-label'>{subject.next}</Text>
          <Box
            className={cn(
              'h-full rounded-full bg-brand-300',
              paletteClass(subject.color)
            )}
            style={{ width: `${subject.progress}%` }}
          />
        </Box>

        <Text className='ui-label text-fg-700'>{subject.progress}%</Text>
      </Card.Footer>
    </Card>
  )
}
