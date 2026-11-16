'use client'

import { MAX_THREAD_DEPTH } from '@shared/config/shared-constants'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { getAuthorDisplayName } from '@/lib/comments/comment-author'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentEntity } from '@/types/components/comments/Comments.types'
import type { CommentItemProps } from '@/types/components/comments/CommentThread.types'
import { CommentActions } from './CommentActions'
import { CommentDivider } from './CommentDivider'
import { CommentEditBox } from './CommentEditBox'
import { CommentHeader } from './CommentHeader'
import { CommentReplyBox } from './CommentReplyBox'
import { useCommentsServices, useCommentsState } from './CommentsProvider'
import { CommentThread } from './CommentThread'

/**
 * One comment and, recursively, its replies. Chrome-free — the surrounding
 * card comes from `CommentList`. This component only decides what goes
 * where; the header, actions, reply box and thread layout each own their own
 * behavior. Replies render after the comment (not inside it) so flattened
 * deep replies sit at the same indent as their parent.
 */
export function CommentItem({
  comment,
  depth,
  parentAuthorName,
  showNestedReplies = false,
  className,
}: CommentItemProps) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(false)
  const { currentUserId, canModerate } = useCommentsServices()
  const { loadMoreThreadReplies, loadingReplyIds, replyErrors } =
    useCommentsState()
  const requireSignIn = useRequireSignIn()

  const replies = comment.replies ?? []
  const initialRepliesCount = comment.initial_replies_count ?? replies.length
  const isRoot = depth === 0
  const canRenderReplies = isRoot || showNestedReplies
  const isThreadExpanded = isRoot ? areRepliesExpanded : showNestedReplies
  const visibleReplies =
    isRoot && !areRepliesExpanded
      ? replies.slice(0, initialRepliesCount)
      : replies
  const authorName = getAuthorDisplayName(comment.author, strings)
  const isFlattened = depth > MAX_THREAD_DEPTH
  const hasMoreInThread = (current: CommentEntity): boolean =>
    Boolean(
      current.replies_has_more ||
        current.replies?.some((reply) => hasMoreInThread(reply))
    )
  const hasLoadedNestedReplies = (current: CommentEntity): boolean =>
    Boolean(
      current.replies?.some(
        (reply) =>
          (reply.replies?.length ?? 0) > 0 || hasLoadedNestedReplies(reply)
      )
    )
  const isLoadingInThread = (current: CommentEntity): boolean =>
    loadingReplyIds.has(current.id) ||
    Boolean(current.replies?.some((reply) => isLoadingInThread(reply)))
  const canExpandThread =
    hasMoreInThread(comment) ||
    replies.length > initialRepliesCount ||
    hasLoadedNestedReplies(comment)

  // Guests get the login modal instead of an editor they couldn't post from.
  const handleToggleReply = () => {
    if (!requireSignIn()) return
    setIsReplyOpen((open) => !open)
  }

  return (
    <Box className={cn('ui-stack gap-2', className)}>
      <Box className={cn('ui-stack gap-4', !isRoot && 'pt-2')}>
        <CommentHeader
          author={comment.author}
          createdAt={comment.created_at}
          isRoot={depth === 0}
          edited={comment.edited}
          replyingTo={isFlattened ? parentAuthorName : undefined}
        />

        {isEditing ? (
          <CommentEditBox
            comment={comment}
            onClose={() => setIsEditing(false)}
          />
        ) : (
          <PortableTextContent className='ui-above-inside'>
            {comment.content}
          </PortableTextContent>
        )}

        {!isEditing && (
          <CommentActions
            comment={comment}
            isReplyOpen={isReplyOpen}
            onToggleReply={handleToggleReply}
            onEdit={() => {
              if (currentUserId === comment.author_id || canModerate) {
                setIsReplyOpen(false)
                setIsEditing(true)
              }
            }}
          />
        )}

        {isReplyOpen && (
          <CommentReplyBox
            parentId={comment.id}
            onClose={() => setIsReplyOpen(false)}
          />
        )}
      </Box>

      {canRenderReplies &&
        (visibleReplies.length > 0 ||
          (isRoot && (areRepliesExpanded || canExpandThread))) && (
          <CommentThread depth={depth}>
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                parentAuthorName={authorName}
                showNestedReplies={isThreadExpanded}
              />
            ))}
            {(isRoot || replyErrors[comment.id]) && (
              <Box className='ui-stack gap-4'>
                {replyErrors[comment.id] && (
                  <Text className='cp-danger-nb'>
                    {replyErrors[comment.id]}
                  </Text>
                )}
                {isRoot && canExpandThread && <CommentDivider />}
                {isRoot && canExpandThread && !areRepliesExpanded && (
                  <Button
                    type='button'
                    className='button button-sm subtle self-start rounded-full px-3'
                    onClick={() => {
                      setAreRepliesExpanded(true)
                      loadMoreThreadReplies(comment.id)
                    }}
                    disabled={isLoadingInThread(comment)}
                  >
                    {isLoadingInThread(comment)
                      ? strings.general.loadingReplies
                      : strings.general.showMoreReplies}
                  </Button>
                )}
                {isRoot && areRepliesExpanded && (
                  <Box className='ui-cluster gap-2'>
                    {hasMoreInThread(comment) && (
                      <Button
                        type='button'
                        className='button button-sm subtle rounded-full px-3'
                        onClick={() => loadMoreThreadReplies(comment.id)}
                        disabled={isLoadingInThread(comment)}
                      >
                        {isLoadingInThread(comment)
                          ? strings.general.loadingReplies
                          : strings.general.showMoreReplies}
                      </Button>
                    )}
                    <Button
                      type='button'
                      className='button button-sm subtle rounded-full px-3'
                      onClick={() => setAreRepliesExpanded(false)}
                      aria-expanded={areRepliesExpanded}
                    >
                      {strings.general.hideReplies}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CommentThread>
        )}
    </Box>
  )
}
