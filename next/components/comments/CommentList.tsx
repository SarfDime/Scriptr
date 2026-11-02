'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { CommentDivider } from './CommentDivider'
import { CommentItem } from './CommentItem'
import { useCommentsState } from './CommentsProvider'

/** All threads in one card, a divider between them (or the empty state). */
export function CommentList() {
  const {
    comments,
    commentsError,
    hasMoreComments,
    isLoadingComments,
    loadMoreComments,
    setSort,
    sort,
  } = useCommentsState()

  if (comments.length === 0 && !isLoadingComments && !commentsError) {
    return (
      <Text className='ui-subtitle'>{COMMENT_STRINGS.general.emptyState}</Text>
    )
  }

  return (
    <Box className='ui-stack gap-3'>
      {comments.length > 0 &&
        comments.map((comment, index) => (
          <Fragment key={comment.id}>
            {index > 0 && <CommentDivider />}
            <CommentItem comment={comment} depth={0} />
          </Fragment>
        ))}
      {isLoadingComments && (
        <Text className='ui-caption' role='status'>
          {COMMENT_STRINGS.general.loadingComments}
        </Text>
      )}
      {commentsError && (
        <Box className='ui-stack gap-2'>
          <Text className='cp-danger-nb'>{commentsError}</Text>
          <Button
            type='button'
            className='button outline'
            onClick={() => setSort(sort)}
          >
            {COMMENT_STRINGS.general.tryAgain}
          </Button>
        </Box>
      )}
      {hasMoreComments && (
        <Button
          type='button'
          className='button button-md subtle self-start'
          onClick={loadMoreComments}
          disabled={isLoadingComments}
        >
          {isLoadingComments
            ? COMMENT_STRINGS.general.loadingComments
            : COMMENT_STRINGS.general.showMoreComments}
        </Button>
      )}
    </Box>
  )
}
