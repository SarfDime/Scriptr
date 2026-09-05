import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { UI_STRINGS } from '@shared/config/strings'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'
import { Box } from './Box'
import { Button } from './Button'

interface ActivityStatsProps {
  savedCount: number
  authoredCount: number
  commentCount: number
  content?: PortableTextType
}

export const ActivityStats = ({
  savedCount,
  authoredCount,
  commentCount,
  content = DEFAULT_ACTIVITY_CONTENT,
}: ActivityStatsProps) => {
  return (
    <Box as='section' className='ui-stack gap-5 border-t border-grey-300 pt-8'>
      <Box className='ui-cluster items-end justify-between gap-3'>
        <PortableTextContent>{content}</PortableTextContent>
        <Button className='button subtle px-2 py-1 ui-caption'>
          <Text>{UI_STRINGS.activity.view}</Text>
        </Button>
      </Box>

      <Box className='grid gap-3 md:grid-cols-3'>
        <Card className='cp-danger p-5'>
          <Heart />
          <Text className='ui-stat'>{savedCount}</Text>
          <Text className='ui-subtitle'>
            {UI_STRINGS.activity.savedScripts}
          </Text>
        </Card>
        <Card className='cp-brand p-5'>
          <DocumentText />
          <Text className='ui-stat'>{authoredCount}</Text>
          <Text className='ui-subtitle'>
            {UI_STRINGS.activity.scriptsAuthored}
          </Text>
        </Card>
        <Card className='cp-warning p-5'>
          <Comment />
          <Text className='ui-stat'>{commentCount}</Text>
          <Text className='ui-subtitle'>
            {UI_STRINGS.activity.helpfulComments}
          </Text>
        </Card>
      </Box>
    </Box>
  )
}
