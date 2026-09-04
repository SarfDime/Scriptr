import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Heart from '@sanity/icons/Heart'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { Card } from '../ui/Card'
import { Box } from './Box'
import { Button } from './Button'

interface ActivityStatsProps {
  savedCount: number
  authoredCount: number
  commentCount: number
}

export const ActivityStats = ({
  savedCount,
  authoredCount,
  commentCount,
}: ActivityStatsProps) => {
  return (
    <Box as='section' className='mt-14 border-t border-grey-300 pt-8'>
      <Box className='mb-5 flex items-end justify-between'>
        <Box>
          <Title as='h2' className='text-xl font-medium tracking-tight'>
            Your activity
          </Title>
          <Text className='mt-1 text-sm text-fg-400'>
            A quick view of the work you have been making.
          </Text>
        </Box>
        <Button className='button subtle px-2 py-1 text-xs'>
          View activity
        </Button>
      </Box>

      <Box className='grid gap-3 md:grid-cols-3'>
        <Card className='ui-palette-rose p-5'>
          <Heart />
          <Text className='mt-5 text-2xl font-medium text-fg-700'>
            {savedCount}
          </Text>
          <Text className='mt-1 text-sm text-fg-400'>Saved scripts</Text>
        </Card>
        <Card className='ui-palette-sky p-5'>
          <DocumentText />
          <Text className='mt-5 text-2xl font-medium text-fg-700'>
            {authoredCount}
          </Text>
          <Text className='mt-1 text-sm text-fg-400'>Scripts authored</Text>
        </Card>
        <Card className='ui-palette-amber p-5'>
          <Comment />
          <Text className='mt-5 text-2xl font-medium text-fg-700'>
            {commentCount}
          </Text>
          <Text className='mt-1 text-sm text-fg-400'>Helpful comments</Text>
        </Card>
      </Box>
    </Box>
  )
}
