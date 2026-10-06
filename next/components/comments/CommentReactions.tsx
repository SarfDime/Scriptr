'use client'

import AddIcon from '@sanity/icons/Add'
import {
  REACTION_TYPE_DETAILS,
  REACTION_TYPES,
} from '@shared/config/shared-constants'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useCommentReactions } from '@/hooks/comments/useCommentReactions'
import { cn } from '@/lib/common-utils'
import type { CommentReactionsProps } from '@/types/components/comments/CommentThread.types'

/**
 * Emoji reactions for one comment. Only reactions that already have a count
 * (or that the viewer used) are shown; the "+" toggle reveals the rest, which
 * keeps the row quiet instead of six always-on emoji per comment. Wrappers
 * (not the buttons) carry the `hidden` so button CSS can't override it.
 */
export function CommentReactions(props: CommentReactionsProps) {
  const { myReactions, reactionsByType, isPending, react } =
    useCommentReactions(props)
  const [showAll, setShowAll] = useState(false)

  return (
    <Box className='ui-cluster gap-1 items-center'>
      {REACTION_TYPES.map((reactionType) => {
        const reaction = REACTION_TYPE_DETAILS[reactionType]
        const count = reactionsByType[reactionType] ?? 0
        const isMine = myReactions.includes(reactionType)
        const isActive = isMine || count > 0

        return (
          <Box
            key={reactionType}
            className={cn(!isActive && !showAll && 'hidden')}
          >
            <Button
              onClick={() => react(reactionType)}
              disabled={isPending}
              aria-pressed={isMine}
              aria-label={COMMENT_STRINGS.reactions.reactWith(reaction.label)}
              className={cn('button gap-1.5 p-2', isMine ? 'outline' : 'ghost')}
            >
              <Text className='text-base leading-none'>{reaction.emoji}</Text>
              {count > 0 && <Text className='text-xs'>{count}</Text>}
            </Button>
          </Box>
        )
      })}
      <Button
        onClick={() => setShowAll((open) => !open)}
        aria-expanded={showAll}
        aria-label={
          showAll
            ? COMMENT_STRINGS.reactions.hideAll
            : COMMENT_STRINGS.reactions.showAll
        }
        className='button ghost p-2'
      >
        <AddIcon
          className={cn('text-xl transition-transform', showAll && 'rotate-45')}
        />
      </Button>
    </Box>
  )
}
