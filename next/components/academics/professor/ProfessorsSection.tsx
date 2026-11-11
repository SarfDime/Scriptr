import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type { ProfessorsSectionProps } from '@/types/academics/professor.types'
import { AdministrationCard } from '../AdministrationCard'

/** Four cards (68px each) plus the gaps between them: a faculty can list
 * dozens of professors, and past four the list scrolls instead of burying the
 * rest of the sidebar. The count badge says how many there are in total. */
const LIST_MAX_HEIGHT = 'max-h-[18.5rem]'

export const ProfessorsSection = ({ professors }: ProfessorsSectionProps) => {
  const professorList = professors ?? []

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader
        title={UI_STRINGS.navigation.professors}
        count={professorList.length}
      />

      {professorList.length > 0 ? (
        <Box className={cn('ui-stack gap-2 overflow-y-auto', LIST_MAX_HEIGHT)}>
          {professorList.map((professor) => {
            const color = getColorPalette({
              type: 'seed',
              value: professor._id,
            })
            return (
              <AdministrationCard
                key={professor._id}
                {...professor}
                color={color}
                subtitle={professor.title}
              />
            )
          })}
        </Box>
      ) : (
        <Text className='ui-caption ui-above-inside'>
          {UI_STRINGS.academics.noProfessorsAssigned}
        </Text>
      )}
    </Card>
  )
}
