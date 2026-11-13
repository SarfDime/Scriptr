'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { cn } from '@/lib/common-utils'
import { Divider } from '../ui/Divider'
import { useCommentsState } from './CommentsProvider'

/** Title, total count, and the button that opens the composer (signed-out
 * visitors get the login modal instead). */
export function CommentsHeader({
  isComposing,
  headingId,
  onWriteClick,
}: {
  isComposing: boolean
  headingId: string
  onWriteClick: () => void
}) {
  const { commentCount, setSort, sort } = useCommentsState()
  const requireSignIn = useRequireSignIn()

  const handleWriteClick = () => {
    if (requireSignIn()) onWriteClick()
  }

  return (
    <Box className='ui-stack gap-2'>
      <SectionHeader
        title={COMMENT_STRINGS.general.title}
        count={commentCount}
        titleVariant='title'
        titleProps={{ id: headingId }}
        actions={
          !isComposing && (
            <Button
              onClick={handleWriteClick}
              className='button solid button-sm'
            >
              {COMMENT_STRINGS.composer.openButton}
            </Button>
          )
        }
      />
      {commentCount > 0 && (
        <Box
          className='ui-cluster gap-2'
          role='group'
          aria-label={COMMENT_STRINGS.general.sortComments}
        >
          <Button
            type='button'
            className={cn(
              'button button-sm',
              sort === 'newest' ? 'solid' : 'subtle'
            )}
            aria-pressed={sort === 'newest'}
            isActive={sort === 'newest'}
            onClick={() => setSort('newest')}
          >
            {COMMENT_STRINGS.general.newest}
          </Button>
          <Button
            type='button'
            className={cn(
              'button button-sm',
              sort === 'top' ? 'solid' : 'subtle'
            )}
            aria-pressed={sort === 'top'}
            isActive={sort === 'top'}
            onClick={() => setSort('top')}
          >
            {COMMENT_STRINGS.general.top}
          </Button>
          <Divider className='mt-3' colorScheme='dark' />
        </Box>
      )}
    </Box>
  )
}
