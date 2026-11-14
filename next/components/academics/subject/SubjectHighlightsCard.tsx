import Launch from '@sanity/icons/Launch'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { DetailLink } from '@/components/ui/DetailLink'
import { Divider } from '@/components/ui/Divider'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { SubjectDetail } from '@/types/academics/subject.types'
import { AcademicBadge } from '../AcademicBadge'

export const SubjectHighlightsCard = async ({
  _id,
  year,
  code,
  credits,
  semester,
  elective,
  syllabus,
  children,
}: SubjectDetail & { children?: ReactNode }) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const color = getColorPalette({ type: 'seed', value: _id, variant: 'nb' })
  const colorBorder = getColorPalette({ type: 'seed', value: _id })
  return (
    <Card className='ui-stack ui-above'>
      <Text className='ui-label-modern'>
        {ui.academics.subject.curriculumDetails}
      </Text>

      <Box className='ui-cluster gap-2'>
        {year && <AcademicBadge type='year' value={year} />}
        {code && <AcademicBadge type='code' value={code} />}
        {credits && <AcademicBadge type='credits' value={credits} />}
        {semester && <AcademicBadge type='semester' value={semester} />}
        {elective && <AcademicBadge type='elective' />}
      </Box>

      {children}

      <Divider className={cn('cp-divider', colorBorder)} />

      <Text className='ui-body text-fg-muted'>
        {ui.academics.subject.revisitPrompt}
      </Text>

      {syllabus && (
        <>
          <Divider className={cn('cp-divider', colorBorder)} />
          <DetailLink
            href={syllabus}
            label={ui.academics.subject.syllabusLabel}
            hideExternalIcon
            className={color}
            value={
              <>
                {ui.academics.subject.viewSyllabusDocument}
                <Launch />
              </>
            }
            valueProps={{ className: 'flex gap-1 items-center' }}
          />
        </>
      )}
    </Card>
  )
}
