'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
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
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { commentCount, setSort, sort } = useCommentsState()
  const requireSignIn = useRequireSignIn()

  const handleWriteClick = () => {
    if (requireSignIn()) onWriteClick()
  }

  return (
    <Box className='ui-stack gap-2'>
      <SectionHeader
        title={strings.general.title}
        count={commentCount}
        titleVariant='title'
        titleProps={{ id: headingId }}
        actions={
          <Box
            className='ui-cluster gap-2'
            role='group'
            aria-label={strings.general.sortComments}
          >
            {commentCount > 0 && (
              <>
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
                  {strings.general.newest}
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
                  {strings.general.top}
                </Button>
                <Divider orientation='vertical' />
              </>
            )}
            {!isComposing && (
              <Button
                onClick={handleWriteClick}
                className='button solid button-sm'
              >
                {strings.composer.openButton}
              </Button>
            )}
          </Box>
        }
      />
      {commentCount > 0 && <Divider className='mt-3' colorScheme='dark' />}
    </Box>
  )
}
