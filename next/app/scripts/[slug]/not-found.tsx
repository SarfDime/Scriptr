import { UI_STRINGS } from '@shared/config/strings'
import Link from 'next/link'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'

export default function NotFound() {
  return (
    <Box as='main' className='ui-container ui-section ui-stack gap-3'>
      <Text className='ui-title'>Script not found</Text>
      <Text className='ui-body'>
        This script may have been removed, or the link is incorrect.
      </Text>
      {/* There is no `/scripts` index page — search is the way back to the
          catalogue. */}
      <Link href='/search' className='button subtle'>
        {UI_STRINGS.scripts.search.pageTitle}
      </Link>
    </Box>
  )
}
