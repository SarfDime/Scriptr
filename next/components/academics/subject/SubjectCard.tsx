import { AcademicBadge } from '@/components/academics/AcademicBadge'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { ClickableCard } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import type { SubjectSidebarItem } from '@/types/academics/subject.types'

export const SubjectCard = ({
  slug,
  name,
  code,
  year,
  credits,
  semester,
  professors = [],
  study,
}: SubjectSidebarItem) => {
  const [firstProfessor, ...restProfessors] = professors ?? []

  const universitySlug = study?.faculty?.university?.slug ?? ''
  const facultySlug = study?.faculty?.slug ?? ''
  const studySlug = study?.slug ?? ''

  const universityName = study?.faculty?.university?.name
  const facultyName = study?.faculty?.name

  return (
    <EntityCard
      href={getAcademicPath({
        type: 'subject',
        universitySlug,
        facultySlug,
        studySlug,
        subjectSlug: slug ?? '',
      })}
      title={name}
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
      className='group gap-4 ui-above-inside'
      footer={
        <ClickableCard.Footer className='ui-cluster w-full flex-wrap items-center justify-between gap-2 pt-2.5 transition-colors duration-300 group-hover:border-t-brand-300'>
          <Box className='ui-cluster flex-wrap gap-2'>
            {year && <AcademicBadge type='year' value={year} />}
            {credits && <AcademicBadge type='credits' value={credits} />}
          </Box>
          {semester && <AcademicBadge type='semester' value={semester} />}
        </ClickableCard.Footer>
      }
    />
  )
}
