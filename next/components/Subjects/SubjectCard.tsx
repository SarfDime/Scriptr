import Menu from '@sanity/icons/Menu'
import { cn, paletteClass } from '@/lib/common-utils'
import type { Subject } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'

interface SubjectCardProps {
  subject: Subject
}

export const SubjectCard = ({ subject }: SubjectCardProps) => {
  return (
    <Card className={cn(paletteClass(subject.color), 'p-4')}>
      <Card.Body className='flex items-start gap-3 p-0'>
        <Box className='mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold'>
          {subject.name.slice(0, 2).toUpperCase()}
        </Box>
        <Box className='min-w-0'>
          <Text className='text-sm font-medium text-fg-700'>
            {subject.name}
          </Text>
          <Text className='mt-1 text-xs text-fg-400'>{subject.code}</Text>
        </Box>
        <Menu className='ml-auto text-fg-400' />
      </Card.Body>

      <Card.Footer className='mt-4 flex flex-col gap-2 p-0'>
        <Box className='flex items-center justify-between text-xs'>
          <Text className='text-fg-400'>{subject.next}</Text>
          <Text className='text-fg-700'>{subject.progress}%</Text>
        </Box>
        <Box className='h-1 overflow-hidden rounded-full bg-grey-200'>
          <Box
            className='h-full rounded-full bg-brand-300'
            style={{ width: `${subject.progress}%` }}
          />
        </Box>
      </Card.Footer>
    </Card>
  )
}
