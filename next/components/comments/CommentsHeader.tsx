'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { useCommentsState } from './CommentsProvider'

/** Title, total count, and the button that opens the composer (signed-out
 * visitors get the login modal instead). */
export function CommentsHeader({
  isComposing,
  onWriteClick,
}: {
  isComposing: boolean
  onWriteClick: () => void
}) {
  const { commentCount } = useCommentsState()
  const requireSignIn = useRequireSignIn()

  const handleWriteClick = () => {
    if (requireSignIn()) onWriteClick()
  }

  return (
    <Box className='ui-cluster items-center justify-between gap-2'>
      <Box className='ui-cluster items-center gap-2'>
        <Text className='ui-title'>{COMMENT_STRINGS.general.title}</Text>
        <Text className='ui-caption text-grey-500'>{commentCount}</Text>
      </Box>
      {!isComposing && (
        <Button onClick={handleWriteClick} className='button solid'>
          {COMMENT_STRINGS.composer.openButton}
        </Button>
      )}
    </Box>
  )
}
