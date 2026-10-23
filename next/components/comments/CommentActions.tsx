'use client'

import EditIcon from '@sanity/icons/Edit'
import ReplyIcon from '@sanity/icons/Undo'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
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
  onEdit,
}: CommentActionsProps) {
  const { currentUserId, currentUserRole } = useCommentsServices()
  const isAuthor = currentUserId === comment.author_id
  const canManage = isAuthor || currentUserRole === 'admin'
  const hasReactions = Object.values(comment.reactions_by_type).some(
    (count) => count > 0
  )

  return (
    <Box className='ui-cluster items-center gap-3'>
      <Box className='ui-cluster items-center gap-3'>
        <CommentLikeButton
          commentId={comment.id}
          initialLiked={comment.liked_by_me}
          initialCount={comment.likes_count}
          disabled={isAuthor}
        />

        <Divider orientation='vertical' className='h-4 self-center' />

        {(!isAuthor || hasReactions) && (
          <CommentReactions
            commentId={comment.id}
            initialMine={comment.my_reactions}
            initialCounts={comment.reactions_by_type}
            disabled={isAuthor}
          />
        )}

        {(!isAuthor || hasReactions) && (
          <Divider orientation='vertical' className='h-4 self-center' />
        )}
      </Box>

      <Box className='ui-cluster items-center gap-3'>
        {canManage && (
          <Button onClick={onEdit} className='button subtle button-sm'>
            <EditIcon />
            <Text className='text-xs'>{COMMENT_STRINGS.actions.edit}</Text>
          </Button>
        )}
        <Button
          onClick={onToggleReply}
          aria-expanded={isReplyOpen}
          className={cn(
            'button button-sm',
            isReplyOpen ? 'cp-brand-int' : 'subtle'
          )}
        >
          <ReplyIcon />
          <Text className='text-xs'>{COMMENT_STRINGS.reply.action}</Text>
        </Button>

        {!isAuthor && (
          <FlagReportButton
            targetType='comment'
            targetId={comment.id}
            canReport={!isAuthor}
            triggerLabel={COMMENT_STRINGS.actions.report}
          />
        )}

        {canManage && <CommentDeleteButton commentId={comment.id} />}
      </Box>
    </Box>
  )
}
