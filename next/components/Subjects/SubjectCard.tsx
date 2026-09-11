import { getSubjectPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { AcademicBadge } from '../academics/AcademicBadge'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
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
  study,
}: MinimalSubject) => {
  const [firstProfessor, ...restProfessors] = professors

  const facultyName = study?.faculty?.name
  const universityName = study?.faculty?.university?.name

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
        {code && <AcademicBadge type='code' value={code} />}
      </ClickableCard.Body>

      <ClickableCard.Footer className='ui-cluster w-full items-center justify-between pt-2'>
        <Box className='ui-cluster gap-2'>
          {year && <AcademicBadge type='year' value={year} />}
          {credits && <AcademicBadge type='credits' value={credits} />}
        </Box>

        {semester && <AcademicBadge type='semester' value={semester} />}
      </ClickableCard.Footer>
    </ClickableCard>
  )
}
