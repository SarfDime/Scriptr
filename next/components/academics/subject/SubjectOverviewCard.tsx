import Book from '@sanity/icons/Book'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { AdministratorList } from '@/components/ui/AdministratorList'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn, createPersonSummaries } from '@/lib/common-utils'
import type { SubjectDetail } from '@/types/academics/subject.types'

export const SubjectOverviewCard = ({
  _id,
  description,
  faculty,
  professors,
}: SubjectDetail) => {
  const color = getColorPalette({ type: 'seed', value: _id, variant: 'nb' })
  const colorBorder = getColorPalette({ type: 'seed', value: _id })

  const administrators = createPersonSummaries(
    { target: professors, title: 'Professor' },
    { target: faculty, title: 'Faculty' },
    { target: faculty?.university, title: 'University' }
  )

  return (
    <Card className='p-6 ui-stack gap-5'>
      <Box className='ui-cluster items-start justify-between gap-5'>
        <Box className='ui-stack gap-2'>
          <Text className='ui-caption text-grey-500 uppercase tracking-wide'>
            Subject overview
          </Text>
          {description && (
            <PortableTextContent>{description}</PortableTextContent>
          )}
        </Box>
        <Box
          className={cn(
            colorBorder,
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'
          )}
        >
          <Book />
        </Box>
      </Box>

      <Divider className={cn('mt-auto cp-green-nb', colorBorder)} />

      <AdministratorList
        administrators={administrators}
        layout='detailLink'
        className='px-0'
        detailLinkProps={{
          className: color,
        }}
      />
    </Card>
  )
}
