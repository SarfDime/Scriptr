import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ClickableCard } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalProfessor } from '@/types/academics/professor.types'

export const ProfessorCard = ({
  _id,
  name,
  title,
  subjects,
  faculties,
  picture,
  universities,
}: MinimalProfessor) => {
  const color = getColorPalette({ type: 'seed', value: _id })

  const facultyNames = faculties?.map((faculty) => faculty.name).join(', ')

  return (
    <ClickableCard
      href={getAcademicPath({
        type: 'professor',
        id: _id,
      })}
      className='group p-4 h-full flex flex-col justify-between gap-3 transition hover:border-brand-500 hover:shadow-sm'
    >
      <ClickableCard.Body className='flex items-start gap-3 flex-1 min-w-0'>
        <Avatar picture={picture} name={name} color={color} />

        <Box className='ui-stack gap-0.5 min-w-0 flex-1'>
          <Title
            as='h3'
            className='ui-body font-semibold group-hover:text-brand truncate'
          >
            {name}
          </Title>

          {title && (
            <Text className='ui-caption text-grey-500 truncate'>{title}</Text>
          )}

          {facultyNames && (
            <Text className='ui-caption text-grey-500 line-clamp-2'>
              {facultyNames}
            </Text>
          )}

          {universities && universities?.length > 0 && (
            <Text className='ui-caption text-grey-400 font-medium truncate'>
              {universities.map((univ) => univ.name).join(', ')}
            </Text>
          )}
        </Box>
      </ClickableCard.Body>

      {subjects && subjects.length > 0 && (
        <ClickableCard.Footer className='ui-cluster gap-1.5 pt-2 border-t border-grey-100/60'>
          {subjects.map((subject) => (
            <Badge
              key={subject._id}
              className='cp-unstyled border border-grey-200 ui-caption'
            >
              {subject.name}
            </Badge>
          ))}
        </ClickableCard.Footer>
      )}
    </ClickableCard>
  )
}
