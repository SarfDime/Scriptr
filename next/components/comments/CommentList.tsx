'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useStrings } from '@/providers/locale/use-strings'
import { CommentDivider } from './CommentDivider'
import { CommentItem } from './CommentItem'
import { useCommentsState } from './CommentsProvider'

/** All threads in one card, a divider between them (or the empty state). */
export function CommentList() {
  const strings = useStrings(COMMENT_STRINGS_PACK)
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
    return <Text className='ui-label-modern'>{strings.general.emptyState}</Text>
  }

  return (
    <Box className='ui-stack gap-3'>
      {comments.length > 0 &&
        comments.map((comment, index) => (
          <Fragment key={comment.id}>
            {index > 0 && <CommentDivider />}
            <CommentItem
              comment={comment}
              depth={0}
              className='content-auto [--content-auto-size:9.5rem]'
            />
          </Fragment>
        ))}
      {isLoadingComments && (
        <Text className='ui-caption' role='status'>
          {strings.general.loadingComments}
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
            {strings.general.tryAgain}
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
            ? strings.general.loadingComments
            : strings.general.showMoreComments}
        </Button>
      )}
    </Box>
  )
}
