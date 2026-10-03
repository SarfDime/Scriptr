import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { UI_STRINGS } from '@shared/config/strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import { cn } from '@/lib/common-utils'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'
import { Box } from './Box'
import { Button } from './Button'

interface ActivityStatsProps {
  /** Omit entirely when viewing someone else's profile — script_favorites
   * has no public SELECT policy (what a person has favored is private),
   * so there's no honest value to show here for another user. Passing 0
   * would falsely claim "definitely nothing saved" rather than "unknown".
   * When undefined, the saved-scripts card doesn't render at all. */
  savedCount?: number
  authoredCount: number
  commentCount: number
  content?: PortableTextValue
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

      <Box
        className={cn(
          'grid gap-3',
          savedCount !== undefined ? 'md:grid-cols-3' : 'md:grid-cols-2'
        )}
      >
        {savedCount !== undefined && (
          <Card className='cp-danger p-5'>
            <Heart />
            <Text className='ui-stat'>{savedCount}</Text>
            <Text className='ui-subtitle'>
              {UI_STRINGS.activity.savedScripts}
            </Text>
          </Card>
        )}
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
