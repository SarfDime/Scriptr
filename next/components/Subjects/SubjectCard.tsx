import { getSubjectPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'
import { ClickableCard } from '../ui/Card'
import { InitialsIcon } from '../ui/InitialsIcon'

export const SubjectCard = ({
  _id,
  name,
  code,
  year,
  credits,
  semester,
  professors = [],
  faculty,
}: MinimalSubject) => {
  const [firstProfessor, ...restProfessors] = professors

  const facultyName = faculty?.name
  const universityName = faculty?.university?.name

  const color = getColorPalette({ type: 'seed', value: _id })
  return (
    <ClickableCard
      href={getSubjectPath(_id)}
      className='group ui-stack gap-4 shadow-2xl p-4'
    >
      <ClickableCard.Body className='flex items-start gap-3 p-0'>
        <InitialsIcon name={name} color={color} />
        <Box className='ui-stack gap-1'>
          <Text className='ui-body'>{name}</Text>
          <Box className='ui-cluster gap-2'>
            {firstProfessor?.name && (
              <Text className='ui-caption'>
                {firstProfessor.name}
                {restProfessors.length > 0 && ` +${restProfessors.length} more`}
              </Text>
            )}
          </Box>
          {(universityName || facultyName) && (
            <Text className='ui-caption'>
              {universityName}
              {universityName && facultyName && ' • '}
              {facultyName}
            </Text>
          )}
        </Box>
        {code && (
          <Badge colorPalette={color} className='ml-auto ui-caption'>
            {code}
          </Badge>
        )}
      </ClickableCard.Body>

      <ClickableCard.Footer className='ui-cluster w-full items-center justify-between pt-2'>
        <Box className='ui-cluster gap-2'>
          {year && (
            // TODO: Factor out all of these badges into a separate reusable academic badges component, and use them where needed
            <Badge
              colorPalette={getColorPalette({
                type: 'year',
                value: year,
              })}
              className='ui-caption'
            >
              Year {year}
            </Badge>
          )}
          {credits !== undefined && (
            <Badge
              colorPalette={getColorPalette({
                type: 'credit',
                value: credits,
              })}
              className='ui-caption'
            >
              {credits} ECTS
            </Badge>
          )}
        </Box>

        {semester && <Text className='ui-caption capitalize'>{semester}</Text>}
      </ClickableCard.Footer>
    </ClickableCard>
  )
}
