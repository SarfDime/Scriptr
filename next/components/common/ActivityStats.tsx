import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { getServerStrings } from '@/lib/server-strings'
import { Text } from '../typography/Text'
import { Box } from './Box'
import { SectionHeader } from './SectionHeader'

interface ActivityStatsProps {
  /** Omit when favorite data was not requested. */
  savedCount?: number
  authoredCount: number
  commentCount: number
}

export const ActivityStats = async ({
  savedCount,
  authoredCount,
  commentCount,
}: ActivityStatsProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const stats = [
    ...(savedCount === undefined
      ? []
      : [
          {
            key: 'saved',
            icon: Heart,
            count: savedCount,
            label: ui.activity.savedScripts,
            color: 'cp-danger',
          },
        ]),
    {
      key: 'authored',
      icon: DocumentText,
      count: authoredCount,
      label: ui.activity.scriptsAuthored,
      color: 'cp-brand',
    },
    {
      key: 'comments',
      icon: Comment,
      count: commentCount,
      label: ui.activity.helpfulComments,
      color: 'cp-warning',
    },
  ]

  return (
    <Box as='section' className='ui-stack ui-above-inside grow basis-56 gap-3'>
      <SectionHeader title={ui.activity.title} />
      <Box className='ui-stack flex-1 justify-between gap-1.5'>
        {stats.map(({ key, icon: Icon, count, label, color }) => (
          <Box key={key} className='flex items-center justify-between gap-2'>
            <Box className='flex min-w-0 items-center gap-2'>
              <Icon className={`${color} shrink-0 rounded-md p-0.5`} />
              <Text className='ui-body'>{label}</Text>
            </Box>
            <Text className='ui-stat'>{count}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
