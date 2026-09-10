import Launch from '@sanity/icons/Launch'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { DetailLink } from '@/components/ui/DetailLink'
import { Divider } from '@/components/ui/Divider'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { SubjectDetail } from '@/types/academics/subject.types'
import { AcademicBadge } from '../AcademicBadge'

export const SubjectHighlightsCard = ({
  _id,
  year,
  code,
  credits,
  semester,
  syllabus,
}: SubjectDetail) => {
  const color = getColorPalette({ type: 'seed', value: _id, variant: 'nb' })
  const colorBorder = getColorPalette({ type: 'seed', value: _id })
  return (
    <Card className='p-6 ui-stack gap-4'>
      <Text className='ui-caption text-grey-500 uppercase tracking-wide'>
        Curriculum details
      </Text>

      <Box className='ui-cluster gap-2'>
        {year && <AcademicBadge type='year' value={year} />}
        {code && <AcademicBadge type='code' value={code} />}
        {credits && <AcademicBadge type='credits' value={credits} />}
        {semester && <AcademicBadge type='semester' value={semester} />}
      </Box>

      <Text className='ui-body text-grey-500'>
        Use this course's shared scripts and syllabus to revisit key material in
        your own time.
      </Text>

      <Divider className={colorBorder} />

      {syllabus && (
        <DetailLink
          href={syllabus}
          label='Syllabus'
          hideExternalIcon
          className={color}
          value={
            <>
              View Syllabus Document
              <Launch />
            </>
          }
          valueProps={{ className: 'flex gap-1 items-center' }}
        />
      )}
    </Card>
  )
}
