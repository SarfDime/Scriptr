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
      <Link href='/scripts' className='button subtle'>
        Back to scripts
      </Link>
    </Box>
  )
}
