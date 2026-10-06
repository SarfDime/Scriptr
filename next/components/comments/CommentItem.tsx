'use client'

import { MAX_THREAD_DEPTH } from '@shared/config/shared-constants'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { getAuthorDisplayName } from '@/lib/comments/comment-author'
import type { CommentItemProps } from '@/types/components/comments/CommentThread.types'
import { CommentActions } from './CommentActions'
import { CommentHeader } from './CommentHeader'
import { CommentReplyBox } from './CommentReplyBox'
import { CommentThread } from './CommentThread'

/**
 * One comment and, recursively, its replies. Chrome-free — the surrounding
 * card comes from `CommentList`. This component only decides what goes
 * where; the header, actions, reply box and thread layout each own their own
 * behaviour. Replies render after the comment (not inside it) so flattened
 * deep replies sit at the same indent as their parent.
 */
export function CommentItem({
  comment,
  depth,
  parentAuthorName,
}: CommentItemProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const requireSignIn = useRequireSignIn()

  const replies = comment.replies ?? []
  const authorName = getAuthorDisplayName(comment.author)
  const isFlattened = depth > MAX_THREAD_DEPTH

  // Guests get the login modal instead of an editor they couldn't post from.
  const handleToggleReply = () => {
    if (!requireSignIn()) return
    setIsReplyOpen((open) => !open)
  }

  return (
    <Box className='ui-stack gap-4'>
      <Box className='ui-stack gap-2'>
        <CommentHeader
          author={comment.author}
          createdAt={comment.created_at}
          isRoot={depth === 0}
          replyingTo={isFlattened ? parentAuthorName : undefined}
        />

        <PortableTextContent className='bg-background-100/60 p-2 rounded-md'>
          {comment.content}
        </PortableTextContent>

        <CommentActions
          comment={comment}
          isReplyOpen={isReplyOpen}
          onToggleReply={handleToggleReply}
        />

        {isReplyOpen && (
          <CommentReplyBox
            parentId={comment.id}
            onClose={() => setIsReplyOpen(false)}
          />
        )}
      </Box>

      {replies.length > 0 && (
        <CommentThread depth={depth}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              parentAuthorName={authorName}
            />
          ))}
        </CommentThread>
      )}
    </Box>
  )
}
