import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Divider } from '@/components/ui/Divider'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { SubjectDetail } from '@/types/academics/subject.types'
import { AcademicBadge } from '../AcademicBadge'
import { SubjectAdministrationCard } from './SubjectAdministrationCard.tsx'

export const SubjectHighlightsCard = async ({
  _id,
  year,
  code,
  credits,
  semester,
  elective,
  syllabus,
  children,
  professors,
  study,
}: SubjectDetail & { children?: ReactNode }) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const color = getColorPalette({ type: 'seed', value: _id, variant: 'nb' })
  const colorBorder = getColorPalette({ type: 'seed', value: _id })
  return (
    <Box className='ui-stack ui-above-opaque'>
      <Box className='ui-cluster gap-2'>
        {year && <AcademicBadge type='year' value={year} />}
        {code && <AcademicBadge type='code' value={code} />}
        {credits && <AcademicBadge type='credits' value={credits} />}
        {semester && <AcademicBadge type='semester' value={semester} />}
        {elective && <AcademicBadge type='elective' />}
        {syllabus && (
          <NextLink
            href={syllabus}
            aria-label={ui.academics.subject.syllabusLabel}
          >
            {ui.academics.subject.syllabusLabel}
          </NextLink>
        )}
      </Box>

      {children}

      <Divider className={cn('cp-divider', colorBorder)} />

      <SubjectAdministrationCard
        color={color}
        professors={professors}
        study={study}
      />
    </Box>
  )
}
