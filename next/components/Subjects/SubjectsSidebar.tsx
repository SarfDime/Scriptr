import type { Subject } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { StudyTipCard } from '../common/StudyTipCard'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { SubjectCard } from './SubjectCard'

interface SubjectsSidebarProps {
  subjects: Array<Subject>
}

export const SubjectsSidebar = ({ subjects }: SubjectsSidebarProps) => {
  return (
    <Box as='aside'>
      <Box className='mb-5 flex items-center justify-between'>
        <Box>
          <Title as='h2' className='text-xl font-medium tracking-tight'>
            Your subjects
          </Title>
          <Text className='mt-1 text-sm text-fg-400'>
            Keep an eye on what is next.
          </Text>
        </Box>
        <Button className='button subtle px-2 py-1 text-xs'>Manage</Button>
      </Box>

      <Box className='ui-stack gap-3'>
        {subjects.map((item) => (
          <SubjectCard key={item.name} subject={item} />
        ))}
      </Box>

      <StudyTipCard />
    </Box>
  )
}
