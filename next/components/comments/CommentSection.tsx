'use client'

import { COMMENTS_SECTION_ID } from '@shared/config/shared-constants'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useEffect, useId, useRef, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { getTargetComments } from '@/lib/api/comments-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
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
  initialLoadFailed = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed)
  const [isRetrying, setIsRetrying] = useState(false)
  const failureToastShownRef = useRef(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (!loadFailed || failureToastShownRef.current) return
    failureToastShownRef.current = true
    addToast({
      type: 'error',
      title: COMMENT_STRINGS.general.loadCommentsError,
      description: COMMENT_STRINGS.general.tryAgain,
    })
  }, [addToast, loadFailed])

  const retryComments = async () => {
    setIsRetrying(true)
    try {
      setComments(await getTargetComments(target))
      setLoadFailed(false)
    } catch {
      addToast({
        type: 'error',
        title: COMMENT_STRINGS.general.loadCommentsError,
        description: COMMENT_STRINGS.general.tryAgain,
      })
    } finally {
      setIsRetrying(false)
    }
  }

  if (loadFailed) {
    return (
      <Box
        as='section'
        id={COMMENTS_SECTION_ID}
        aria-labelledby='comments-heading'
        className='ui-stack scroll-mt-20 ui-above'
      >
        <SectionHeader
          title={COMMENT_STRINGS.general.title}
          titleProps={{ id: 'comments-heading' }}
        />
        <Box className='ui-cluster gap-3' role='alert'>
          <p className='ui-subtitle'>
            {COMMENT_STRINGS.general.loadCommentsError}
          </p>
          <Button
            type='button'
            className='button solid'
            isLoading={isRetrying}
            onClick={retryComments}
          >
            {COMMENT_STRINGS.general.tryAgain}
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <CommentsProvider target={target} initialComments={comments}>
      <CommentSectionBody />
    </CommentsProvider>
  )
}

function CommentSectionBody() {
  const [isComposing, setIsComposing] = useState(false)
  const headingId = useId()

  return (
    // scroll-mt keeps the heading clear of the sticky nav when jumped to via
    // the `#comments` link on script cards.
    <Box
      as='section'
      id={COMMENTS_SECTION_ID}
      aria-labelledby={headingId}
      className='ui-stack scroll-mt-20 ui-above'
    >
      <CommentsHeader
        headingId={headingId}
        isComposing={isComposing}
        onWriteClick={() => setIsComposing(true)}
      />
      {isComposing && <CommentComposer onClose={() => setIsComposing(false)} />}
      <CommentList />
    </Box>
  )
}
