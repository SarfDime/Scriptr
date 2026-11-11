import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { UI_STRINGS } from '@shared/config/strings'
import { Text } from '../typography/Text'
import { Box } from './Box'
import { Button } from './Button'
import { SectionHeader } from './SectionHeader'

interface ActivityStatsProps {
  /** Omit when favorite data was not requested. */
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
  const stats = [
    ...(savedCount === undefined
      ? []
      : [
          {
            key: 'saved',
            icon: Heart,
            count: savedCount,
            label: UI_STRINGS.activity.savedScripts,
            color: 'cp-danger',
          },
        ]),
    {
      key: 'authored',
      icon: DocumentText,
      count: authoredCount,
      label: UI_STRINGS.activity.scriptsAuthored,
      color: 'cp-brand',
    },
    {
      key: 'comments',
      icon: Comment,
      count: commentCount,
      label: UI_STRINGS.activity.helpfulComments,
      color: 'cp-warning',
    },
  ]

  return (
    <Box as='section' className='ui-stack gap-4 p-4 ui-above'>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button className='button button-sm subtle'>
            <Text>{UI_STRINGS.activity.view}</Text>
          </Button>
        }
      />
      <Box className='flex flex-wrap gap-2'>
        {stats.map(({ key, icon: Icon, count, label, color }) => (
          <Box
            key={key}
            className='ui-stack flex-[1_1_8rem] gap-1 rounded-md p-2'
          >
            <Box className='ui-cluster gap-2'>
              <Icon className={`${color} h-7 w-7 rounded-md p-1`} />
              <Text className='ui-stat'>{count}</Text>
            </Box>
            <Text className='ui-subtitle'>{label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
