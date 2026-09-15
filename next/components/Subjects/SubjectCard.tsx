import { AcademicBadge } from '@/components/academics/AcademicBadge'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { ClickableCard } from '@/components/ui/Card'
import { InitialsIcon } from '@/components/ui/InitialsIcon'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalSubject } from '@/types/academics/subject.types'

export const SubjectCard = ({
  _id,
  slug,
  name,
  code,
  year,
  credits,
  semester,
  professors = [],
  study,
}: MinimalSubject) => {
  const [firstProfessor, ...restProfessors] = professors
  const color = getColorPalette({ type: 'seed', value: _id })

  const universitySlug =
    study?.faculty?.university?.slug ?? study?.faculty?.university?._id ?? ''
  const facultySlug = study?.faculty?.slug ?? study?.faculty?._id ?? ''
  const studySlug = study?.slug ?? study?._id ?? ''

  const universityName = study?.faculty?.university?.name
  const facultyName = study?.faculty?.name

  return (
    <EntityCard
      href={getAcademicPath({
        type: 'subject',
        universitySlug,
        facultySlug,
        studySlug,
        subjectSlug: slug ?? _id,
      })}
      title={name}
      media={<InitialsIcon name={name} color={color} />}
      subtitle={
        firstProfessor?.name
          ? `${firstProfessor.name}${restProfessors.length > 0 ? ` +${restProfessors.length} more` : ''}`
          : undefined
      }
      caption={
        universityName || facultyName
          ? [universityName, facultyName].filter(Boolean).join(' • ')
          : undefined
      }
      headerAside={code && <AcademicBadge type='code' value={code} />}
      className='group ui-stack gap-4 shadow-2xl p-4'
      footer={
        <ClickableCard.Footer className='ui-cluster w-full items-center justify-between pt-2'>
          <Box className='ui-cluster gap-2'>
            {year && <AcademicBadge type='year' value={year} />}
            {credits && <AcademicBadge type='credits' value={credits} />}
          </Box>
          {semester && <AcademicBadge type='semester' value={semester} />}
        </ClickableCard.Footer>
      }
    />
  )
}
