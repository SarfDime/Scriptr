'use client'

import { REACTION_TYPES } from '@shared/config/shared-constants'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import {
  postComment,
  postReaction,
  postReply,
  toggleLike,
} from '@/lib/api/comments-api'
import { cn } from '@/lib/common-utils'
import { plainTextToPortableText } from '@/lib/portable-text'
import type {
  CommentEntity,
  CommentSectionProps,
} from '@/types/components/Comments.types'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Card } from '../ui/Card'
import { FlagReportButton } from '../ui/FlagReportButton'

export function CommentSection({
  target,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [draftText, setDraftText] = useState('')
  const { state, run } = useProtectedAction(postComment)

  const handleSubmit = async () => {
    if (!draftText.trim()) return
    const result = await run(target, plainTextToPortableText(draftText.trim()))
    if (result.ok) {
      setComments((prev) => [result.data.comment, ...prev])
      setDraftText('')
    }
  }

  return (
    <Box className='ui-stack gap-4'>
      <Text className='ui-title'>Comments</Text>

      <Card>
        <Card.Body className='ui-stack gap-2'>
          {/* TODO: swap for the project's real Portable Text editor once
              identified — plain textarea placeholder shown for structure only */}
          <textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className='ui-card p-2 w-full'
            rows={3}
            aria-label='Write a comment'
            disabled={state.status === 'pending'}
          />
          {(state.status === 'restricted' || state.status === 'error') && (
            <Text className='ui-caption text-danger-600'>{state.message}</Text>
          )}
          <div className='ui-cluster justify-end'>
            <Button
              onClick={handleSubmit}
              disabled={!draftText.trim() || state.status === 'pending'}
              className='button solid'
            >
              Post comment
            </Button>
          </div>
        </Card.Body>
      </Card>

      {comments.length === 0 ? (
        <Text className='ui-subtitle'>
          No comments yet — be the first to say something.
        </Text>
      ) : (
        <div className='ui-stack gap-3'>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} depth={0} />
          ))}
        </div>
      )}
    </Box>
  )
}

function CommentItem({
  comment,
  depth,
}: {
  comment: CommentEntity
  depth: number
}) {
  const [liked, setLiked] = useState(comment.liked_by_me)
  const [likesCount, setLikesCount] = useState(comment.likes_count)
  const [myReaction, setMyReaction] = useState(comment.my_reaction)
  const [replies, setReplies] = useState(comment.replies ?? [])
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')

  const { state: reactionState, run: runReaction } =
    useProtectedAction(postReaction)
  const { state: replyState, run: runReply } = useProtectedAction(postReply)

  const handleLike = async () => {
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikesCount((count) => count + (wasLiked ? -1 : 1))
    try {
      await toggleLike(comment.id)
    } catch {
      setLiked(wasLiked)
      setLikesCount((count) => count + (wasLiked ? 1 : -1))
    }
  }

  const handleReact = async (reactionType: string) => {
    const result = await runReaction(comment.id, reactionType)
    if (result.ok) setMyReaction(reactionType)
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    const result = await runReply(
      comment.id,
      plainTextToPortableText(replyText.trim())
    )
    if (result.ok) {
      setReplies((prev) => [...prev, result.data.reply])
      setReplyText('')
      setShowReplyBox(false)
    }
  }

  return (
    <Card className={cn(depth > 0 && 'ml-6')}>
      <Card.Body className='ui-stack gap-2'>
        <div className='ui-cluster gap-2 items-center'>
          <Text className='ui-label'>
            {comment.author
              ? (comment.author.full_name ?? comment.author.username)
              : 'Deleted user'}
          </Text>
          <Text className='ui-caption'>
            {new Date(comment.created_at).toLocaleDateString()}
          </Text>
        </div>

        <PortableTextContent renderWrapper={false}>
          {comment.content}
        </PortableTextContent>

        <div className='ui-cluster gap-3 items-center'>
          <Button
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike comment' : 'Like comment'}
            className={cn('button', liked ? 'outline' : 'ghost')}
          >
            👍 {likesCount}
          </Button>

          <div className='ui-cluster gap-1'>
            {REACTION_TYPES.map((emoji) => (
              <Button
                key={emoji}
                onClick={() => handleReact(emoji)}
                disabled={reactionState.status === 'pending'}
                aria-pressed={myReaction === emoji}
                aria-label={`React with ${emoji}`}
                className={cn(
                  'button',
                  myReaction === emoji ? 'outline' : 'ghost'
                )}
              >
                {emoji}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setShowReplyBox((open) => !open)}
            className='button link'
          >
            Reply
          </Button>

          <FlagReportButton
            targetType='comment'
            targetId={comment.id}
            triggerLabel='Report'
          />
        </div>

        {reactionState.status === 'restricted' && (
          <Text className='ui-caption text-danger-600'>
            {reactionState.message}
          </Text>
        )}

        {showReplyBox && (
          <Box className='ui-stack gap-2'>
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              className='ui-card p-2 w-full'
              rows={2}
              aria-label='Write a reply'
              disabled={replyState.status === 'pending'}
            />
            {replyState.status === 'restricted' && (
              <Text className='ui-caption text-danger-600'>
                {replyState.message}
              </Text>
            )}
            <div className='ui-cluster justify-end gap-2'>
              <Button
                onClick={() => setShowReplyBox(false)}
                className='button subtle'
              >
                Cancel
              </Button>
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || replyState.status === 'pending'}
                className='button solid'
              >
                Post reply
              </Button>
            </div>
          </Box>
        )}

        {replies.length > 0 && (
          <div className='ui-stack gap-2'>
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
