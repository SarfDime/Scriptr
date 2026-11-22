import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ShowMoreList } from '@/components/common/ShowMoreList'
import { Text } from '@/components/typography/Text'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { ProfessorsSectionProps } from '@/types/academics/professor.types'
import { AdministrationCard } from '../AdministrationCard'

const LIST_MAX_HEIGHT = 'max-h-[20.5rem]'

export const ProfessorsSection = async ({
  professors,
}: ProfessorsSectionProps) => {
  const strings = await getServerStrings(UI_STRINGS_PACK)
  const professorList = professors ?? []

  return (
    <Box as='section' className='ui-stack ui-above'>
      <SectionHeader
        title={strings.navigation.professors}
        count={professorList.length}
      />

      {professorList.length > 0 ? (
        <ShowMoreList
          className={cn('ui-stack gap-2 overflow-y-auto', LIST_MAX_HEIGHT)}
        >
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
        </ShowMoreList>
      ) : (
        <Text className='ui-caption ui-above-inside'>
          {strings.academics.noProfessorsAssigned}
        </Text>
      )}
    </Box>
  )
}
