'use client'

import { COMMENTS_SECTION_ID } from '@shared/config/shared-constants'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import type { CommentSectionProps } from '@/types/components/comments/Comments.types'
import { CommentComposer } from './CommentComposer'
import { CommentList } from './CommentList'
import { CommentsHeader } from './CommentsHeader'
import { CommentsProvider } from './CommentsProvider'

/**
 * Comments for a script (or any other target): wires the data provider to the
 * header, composer and list. All real behaviour lives in those pieces; this
 * file only owns whether the composer is open.
 */
export function CommentSection({
  target,
  initialComments,
}: CommentSectionProps) {
  return (
    <CommentsProvider target={target} initialComments={initialComments}>
      <CommentSectionBody />
    </CommentsProvider>
  )
}

function CommentSectionBody() {
  const [isComposing, setIsComposing] = useState(false)

  return (
    // scroll-mt keeps the heading clear of the sticky nav when jumped to via
    // the `#comments` link on script cards.
    <Box id={COMMENTS_SECTION_ID} className='ui-stack gap-4 scroll-mt-20'>
      <CommentsHeader
        isComposing={isComposing}
        onWriteClick={() => setIsComposing(true)}
      />
      {isComposing && <CommentComposer onClose={() => setIsComposing(false)} />}
      <CommentList />
    </Box>
  )
}
