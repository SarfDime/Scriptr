import { getSubjectPath } from '@/lib/academic-routes'
import {
  getColorPallette,
  getCreditColor,
  YEAR_COLORS,
} from '@/lib/color-pallette-gen'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'
import { ClickableCard } from '../ui/Card'
import { InitialsIcon } from '../ui/InitialsIcon'

export const SubjectCard = (subject: MinimalSubject) => {
  const professors = subject.professors ?? []
  const [firstProfessor, ...restProfessors] = professors

  const facultyName = subject.faculty?.name
  const universityName = subject.faculty?.university?.name

  const color = getColorPallette(subject._id)
  return (
    <ClickableCard
      href={getSubjectPath(subject._id)}
      className='group ui-stack gap-4 shadow-2xl p-4'
    >
      <ClickableCard.Body className='flex items-start gap-3 p-0'>
        <InitialsIcon name={subject.name} color={color} />
        <Box className='ui-stack gap-1'>
          <Text className='ui-body'>{subject.name}</Text>
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
        {subject.code && (
          <Badge colorPalette={color} className='ml-auto ui-caption'>
            {subject.code}
          </Badge>
        )}
      </ClickableCard.Body>

      <ClickableCard.Footer className='ui-cluster w-full items-center justify-between pt-2'>
        <Box className='ui-cluster gap-2'>
          {subject.year && (
            <Badge
              colorPalette={YEAR_COLORS[subject.year] ?? 'cp-yellow'}
              className='ui-caption'
            >
              Year {subject.year}
            </Badge>
          )}
          {subject.credits !== undefined && (
            <Badge
              colorPalette={getCreditColor(subject.credits)}
              className='ui-caption'
            >
              {subject.credits} ECTS
            </Badge>
          )}
        </Box>

        {subject.semester && (
          <Text className='ui-caption capitalize'>{subject.semester}</Text>
        )}
      </ClickableCard.Footer>
    </ClickableCard>
  )
}
