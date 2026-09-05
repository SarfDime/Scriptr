import { UI_STRINGS } from '@shared/config/strings'
import type { SubjectsSidebarProps } from '@/types/components/Subjects.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { StudyTipCard } from '../common/StudyTipCard'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Text } from '../typography/Text'
import { SubjectCard } from './SubjectCard'

export const SubjectsSidebar = ({
  subjects,
  content,
}: SubjectsSidebarProps) => {
  return (
    <Box as='aside' className='ui-stack gap-4'>
      <Box className='ui-cluster items-start justify-between gap-3'>
        <PortableTextContent>{content}</PortableTextContent>
        <Button className='button subtle px-2 py-1 ui-caption'>
          <Text>{UI_STRINGS.subjects.manage}</Text>
        </Button>
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
