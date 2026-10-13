import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import type { ProfessorsSectionProps } from '@/types/academics/professor.types'
import { ProfessorCard } from './ProfessorCard'

export const ProfessorsSection = ({ professors }: ProfessorsSectionProps) => {
  const professorList = professors ?? []

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader title='Professors' count={professorList.length} />

      {professorList.length > 0 ? (
        <Box className='ui-stack'>
          {professorList.map((professor) => (
            <ProfessorCard key={professor._id} {...professor} />
          ))}
        </Box>
      ) : (
        <Text className='ui-caption ui-above-inside'>
          No professors assigned to this faculty.
        </Text>
      )}
    </Card>
  )
}
