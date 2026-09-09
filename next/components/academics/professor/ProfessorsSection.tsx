import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { ProfessorsSectionProps } from '@/types/academics/professor.types'
import { ProfessorCard } from './ProfessorCard'

export const ProfessorsSection = ({ professors }: ProfessorsSectionProps) => {
  const professorList = professors ?? []

  return (
    <Card className='p-6 ui-stack gap-4'>
      <Box className='ui-cluster justify-between items-center'>
        <Title className='ui-title font-bold'>Professors</Title>
        <Badge className='cp-brand'>{professorList?.length} Professors</Badge>
      </Box>

      {professorList.length > 0 ? (
        <Box className='ui-stack'>
          {professorList.map((professor) => (
            <ProfessorCard key={professor._id} {...professor} />
          ))}
        </Box>
      ) : (
        <Text className='ui-caption text-grey-500'>
          No professors assigned to this faculty.
        </Text>
      )}
    </Card>
  )
}
