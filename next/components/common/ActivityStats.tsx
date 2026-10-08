import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'
import { Box } from './Box'
import { Button } from './Button'
import { SectionHeader } from './SectionHeader'

interface ActivityStatsProps {
  /** Omit for contexts where favorite data was not requested. Public profile
   * responses intentionally include favorites through their dedicated
   * server-side projection. */
  savedCount?: number
  authoredCount: number
  commentCount: number
  title?: string
  subtitle?: string
}

export const ActivityStats = ({
  savedCount,
  authoredCount,
  commentCount,
  title = UI_STRINGS.activity.title,
  subtitle = UI_STRINGS.activity.subtitle,
}: ActivityStatsProps) => {
  return (
    <Box as='section' className='p-4 ui-above-light'>
      <Box className='ui-stack gap-5 p-4 ui-above-inside'>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actions={
            <Button className='button button-sm subtle'>
              <Text>{UI_STRINGS.activity.view}</Text>
            </Button>
          }
        />

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
    </Box>
  )
}
