'use client'

import ReplyIcon from '@sanity/icons/Undo'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { FlagReportButton } from '@/components/ui/FlagReportButton'
import { cn } from '@/lib/common-utils'
import type { CommentActionsProps } from '@/types/components/comments/CommentThread.types'
import { CommentDeleteButton } from './CommentDeleteButton'
import { CommentLikeButton } from './CommentLikeButton'
import { CommentReactions } from './CommentReactions'
import { useCommentsServices } from './CommentsProvider'

/**
 * The action row under a comment. It only composes the individual actions —
 * each one owns its own behaviour. One left-aligned row so the actions stay
 * next to the text on wide screens; it wraps on narrow ones. Every button
 * shares the `p-2` footprint so the row reads as one size.
 */
export function CommentActions({
  comment,
  isReplyOpen,
  onToggleReply,
}: CommentActionsProps) {
  const { currentUserId } = useCommentsServices()
  const isAuthor = currentUserId === comment.author_id

  return (
    <Box className='ui-cluster items-center gap-x-3 gap-y-1'>
      <Box className='ui-cluster items-center gap-1'>
        <CommentLikeButton
          commentId={comment.id}
          initialLiked={comment.liked_by_me}
          initialCount={comment.likes_count}
        />
        <CommentReactions
          commentId={comment.id}
          initialMine={comment.my_reactions}
          initialCounts={comment.reactions_by_type}
        />
      </Box>

      <Box className='ui-cluster items-center gap-3'>
        <Button
          onClick={onToggleReply}
          aria-expanded={isReplyOpen}
          className={cn(
            'button subtle gap-1.5 p-2',
            isReplyOpen && 'text-brand'
          )}
        >
          <ReplyIcon />
          <Text className='text-xs'>{COMMENT_STRINGS.reply.action}</Text>
        </Button>

        <FlagReportButton
          targetType='comment'
          targetId={comment.id}
          triggerLabel={COMMENT_STRINGS.actions.report}
          triggerClassName='button subtle gap-1.5 p-2 text-xs'
        />

        {isAuthor && <CommentDeleteButton commentId={comment.id} />}
      </Box>
    </Box>
  )
}
