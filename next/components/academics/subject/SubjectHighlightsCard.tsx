import Launch from '@sanity/icons/Launch'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DetailLink } from '@/components/ui/DetailLink'
import { Divider } from '@/components/ui/Divider'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { SubjectDetail } from '@/types/academics/subject.types'

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
        <Badge
          colorPalette={
            getColorPalette({ type: 'year', value: year }) ?? 'cp-yellow'
          }
        >
          Year {year}
        </Badge>
        {code && (
          <Badge
            colorPalette={getColorPalette({ type: 'seed', value: code })}
            className='border border-grey-200'
          >
            {code}
          </Badge>
        )}
        {credits && (
          <Badge
            colorPalette={getColorPalette({ type: 'credit', value: credits })}
            className='border border-grey-200'
          >
            {credits} ECTS
          </Badge>
        )}

        {semester && (
          <Badge
            colorPalette={
              getColorPalette({ type: 'semester', value: semester }) ??
              'cp-yellow'
            }
            className='capitalize'
          >
            {semester}
          </Badge>
        )}
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
