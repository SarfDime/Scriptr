'use client'

import AddCircle from '@sanity/icons/AddCircle'
import {
  REACTION_TYPE_DETAILS,
  REACTION_TYPES,
} from '@shared/config/shared-constants'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useCommentReactions } from '@/hooks/comments/useCommentReactions'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentReactionsProps } from '@/types/components/comments/CommentThread.types'

export function CommentReactions(props: CommentReactionsProps) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const [showAllReactions, setShowAllReactions] = useState(false)
  const { myReactions, reactionsByType, isPending, react } =
    useCommentReactions(props)
  const disabled = props.disabled ?? false

  return (
    <Box className='ui-cluster gap-2 items-center'>
      {REACTION_TYPES.filter((reactionType) => {
        const count = reactionsByType[reactionType] ?? 0
        return showAllReactions && !disabled ? true : count > 0
      }).map((reactionType) => {
        const reaction = REACTION_TYPE_DETAILS[reactionType]
        const label = strings.reactions.labels[reactionType]
        const count = reactionsByType[reactionType] ?? 0
        const isMine = myReactions.includes(reactionType)

        return (
          <Button
            key={reactionType}
            onClick={() => react(reactionType)}
            disabled={disabled || isPending}
            isActive={isMine}
            aria-pressed={isMine}
            aria-label={strings.reactions.reactWith(label, count)}
            className={cn(
              'button button-sm ghost gap-1.5 disabled:opacity-100 disabled:filter-none py-2 px-2',
              isMine && 'pl-1.5'
            )}
          >
            <Text className='text-base leading-none'>{reaction.emoji}</Text>
            {count > 0 && <Text className='text-xs'>{count}</Text>}
          </Button>
        )
      })}
      {!disabled && (
        <Button
          type='button'
          className={'button ghost button-sm px-2'}
          onClick={() => setShowAllReactions((shown) => !shown)}
          aria-expanded={showAllReactions}
          isActive={showAllReactions}
          aria-label={
            showAllReactions
              ? strings.reactions.hideAll
              : strings.reactions.showAll
          }
        >
          <AddCircle className={showAllReactions ? 'rotate-45' : undefined} />
        </Button>
      )}
    </Box>
  )
}
