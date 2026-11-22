'use client'

import { AcademicBadge } from '@/components/academics/AcademicBadge'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { ClickableCard } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { useLocale } from '@/providers/locale/LocaleProvider'
import type { SubjectSidebarItem } from '@/types/academics/subject.types'

/** A subject in a list: the entity overview card, narrowed to the fields a
 * sidebar needs. */
export const SubjectCard = ({
  slug,
  name,
  code,
  year,
  credits,
  semester,
  elective,
  professors,
  study,
}: SubjectSidebarItem) => {
  const { locale } = useLocale()
  const [firstProfessor, ...restProfessors] = professors ?? []

  const universitySlug = study?.faculty?.university?.slug ?? ''
  const facultySlug = study?.faculty?.slug ?? ''
  const studySlug = study?.slug ?? ''

  const href = getAcademicPath(
    {
      type: 'subject',
      siteSlug: study?.siteSlug,
      universitySlug,
      facultySlug,
      studySlug,
      subjectSlug: slug ?? '',
    },
    locale
  )

  const color = getColorPalette({ value: slug ?? '' })

  return (
    <EntityCard
      href={href}
      title={name}
      subtitle={
        firstProfessor?.name
          ? `${firstProfessor.name}${restProfessors.length > 0 ? ` +${restProfessors.length} more` : ''}`
          : undefined
      }
      headerAside={code && <AcademicBadge type='code' value={code} />}
      className={color}
      footer={
        <ClickableCard.Footer className='ui-cluster w-full flex-wrap items-center justify-between gap-2 pt-2.5 transition-colors duration-300 group-hover:cp-border'>
          <Box className='ui-cluster flex-wrap gap-2'>
            {year && <AcademicBadge type='year' value={year} />}
            {credits && <AcademicBadge type='credits' value={credits} />}
            {elective && <AcademicBadge type='elective' />}
          </Box>
          {semester && <AcademicBadge type='semester' value={semester} />}
        </ClickableCard.Footer>
      }
    />
  )
}
