import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Avatar } from '@/components/ui/Avatar'
import { ClickableCard } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalProfessor } from '@/types/academics/professor.types'

export const ProfessorCard = ({
  _id,
  slug,
  name,
  title,
  picture,
}: MinimalProfessor) => {
  if (!slug) return null

  const color = getColorPalette({ type: 'seed', value: _id })

  return (
    <ClickableCard
      href={getAcademicPath({
        type: 'professor',
        professorSlug: slug,
      })}
      className='group h-full flex flex-col justify-between transition hover:border-brand-500 hover:shadow-sm ui-above-inside p-2'
    >
      <ClickableCard.Body className='ui-cluster items-start flex-nowrap'>
        <Avatar
          className='shrink-0'
          picture={picture}
          name={name}
          color={color}
        />

        <Box className='ui-stack gap-0.5 w-full overflow-hidden'>
          <Title
            as='h3'
            className='ui-body-strong group-hover:text-brand truncate'
          >
            {name}
          </Title>

          {title && <Text className='ui-caption truncate'>{title}</Text>}
        </Box>
      </ClickableCard.Body>
    </ClickableCard>
  )
}
