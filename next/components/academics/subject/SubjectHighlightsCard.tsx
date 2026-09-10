import Launch from '@sanity/icons/Launch'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DetailLink } from '@/components/ui/DetailLink'
import { Divider } from '@/components/ui/Divider'
import { getColorPallette, YEAR_COLORS } from '@/lib/color-pallette-gen'
import type { SubjectDetail } from '@/types/academics/subject.types'

export const SubjectHighlightsCard = ({
  _id,
  year,
  code,
  credits,
  semester,
  syllabus,
}: SubjectDetail) => {
  const color = getColorPallette(_id)

  return (
    <Card className='p-6 ui-stack gap-4'>
      <Text className='ui-caption text-grey-500 uppercase tracking-wide'>
        Curriculum details
      </Text>

      <Box className='ui-cluster gap-2'>
        <Badge colorPalette={YEAR_COLORS[year] ?? 'cp-yellow'}>
          Year {year}
        </Badge>
        {code && (
          <Badge colorPalette='cp-unstyled' className='border border-grey-200'>
            {code}
          </Badge>
        )}
        {credits && (
          <Badge colorPalette='cp-unstyled' className='border border-grey-200'>
            {credits} ECTS
          </Badge>
        )}

        {semester && (
          <Badge colorPalette={color} className='capitalize'>
            {semester}
          </Badge>
        )}
      </Box>

      <Text className='ui-body text-grey-500'>
        Use this course's shared scripts and syllabus to revisit key material in
        your own time.
      </Text>

      <Divider />

      {syllabus && (
        <DetailLink
          href={syllabus}
          label='Syllabus'
          hideExternalIcon
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
