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
  slug,
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
        professorSlug: slug ?? _id,
      })}
      className='group p-4 h-full flex flex-col justify-between gap-3 transition hover:border-brand-500 hover:shadow-sm ui-above'
    >
      <ClickableCard.Body className='ui-cluster'>
        <Avatar picture={picture} name={name} color={color} />

        <Box className='ui-stack gap-0.5'>
          <Title
            as='h3'
            className='ui-body-strong group-hover:text-brand truncate'
          >
            {name}
          </Title>

          {title && <Text className='ui-caption truncate'>{title}</Text>}

          {facultyNames && (
            <Text className='ui-caption line-clamp-2'>{facultyNames}</Text>
          )}

          {universities && universities?.length > 0 && (
            <Text className='ui-caption text-grey-400 font-medium truncate'>
              {universities.map((univ) => univ.name).join(', ')}
            </Text>
          )}
        </Box>
      </ClickableCard.Body>

      {subjects && subjects.length > 0 && (
        <ClickableCard.Footer className='ui-cluster gap-2'>
          {subjects.slice(0, 2).map((subject) => (
            <Badge
              key={subject._id}
              className='rounded-md ui-label'
              colorPalette={getColorPalette({ value: subject._id })}
            >
              {subject.name}
            </Badge>
          ))}

          {subjects.length > 2 && (
            <Badge className='rounded-md ui-label' colorPalette='cp-gray'>
              +{subjects.length - 2}
            </Badge>
          )}
        </ClickableCard.Footer>
      )}
    </ClickableCard>
  )
}
