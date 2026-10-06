'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Fragment } from 'react'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { CommentDivider } from './CommentDivider'
import { CommentItem } from './CommentItem'
import { useCommentsState } from './CommentsProvider'

/** All threads in one card, a divider between them (or the empty state). */
export function CommentList() {
  const { comments } = useCommentsState()

  if (comments.length === 0) {
    return (
      <Text className='ui-subtitle'>{COMMENT_STRINGS.general.emptyState}</Text>
    )
  }

  return (
    <Card className='ui-above'>
      <Card.Body className='ui-stack gap-4'>
        {comments.map((comment, index) => (
          <Fragment key={comment.id}>
            {index > 0 && <CommentDivider />}
            <CommentItem comment={comment} depth={0} />
          </Fragment>
        ))}
      </Card.Body>
    </Card>
  )
}
