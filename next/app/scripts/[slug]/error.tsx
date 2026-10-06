'use client'

import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'

export default function ScriptError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Box as='main' className='ui-container ui-section ui-stack gap-3'>
      <Text className='ui-title'>
        Something went wrong loading this script.
      </Text>
      <Text className='ui-body'>{error.message || 'Please try again.'}</Text>
      <Button onClick={reset} className='button solid'>
        Try again
      </Button>
    </Box>
  )
}
