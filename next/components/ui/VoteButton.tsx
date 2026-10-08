'use client'

import Heart from '@sanity/icons/Heart'
import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { cn } from '@/lib/common-utils'

export type VoteResult = {
  voted: boolean
  /** Authoritative count from the server, when the endpoint returns one. When omitted the button keeps its optimistic ±1. */
  count?: number
}

export type VoteButtonProps = {
  /** Server-fetched — pass down rather than re-fetching client-side on mount. */
  initialVoted: boolean
  initialCount: number
  /** Toggles the caller's vote and reports the resulting state. */
  action: () => Promise<VoteResult>
  /** Visible text in the `full` variant and base of the aria/toast copy, e.g. `Upvote` or `Like`. */
  label: string
  /** What is being voted on, for aria/toast copy, e.g. `script` or `comment`. */
  noun: string
  /** `full`: label + divider + count. `compact`: icon + count. */
  variant?: 'full' | 'compact'
  className?: string
  disabled?: boolean
}

/**
 * Generic optimistic vote/like toggle. The caller supplies the endpoint
 * through `action` (adapting its response to `VoteResult`), so the same
 * button serves script upvotes and comment likes. State flips immediately and
 * rolls back on failure (`useProtectedAction` shows the toast, including the
 * sign-in prompt for guests); a server-provided `count` replaces the
 * optimistic one. Server Components can't pass functions to client
 * components, so they render a thin client wrapper (e.g. `ScriptVoteButton`).
 */
export function VoteButton({
  initialVoted,
  initialCount,
  action,
  label,
  noun,
  variant = 'full',
  className,
  disabled = false,
}: VoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialCount)
  const lowerLabel = label.toLowerCase()
  const requireSignIn = useRequireSignIn()
  const { state, run } = useProtectedAction(action, {
    errorTitle: UI_STRINGS.general.couldNotUpdate(lowerLabel),
  })

  const handleClick = async () => {
    if (!requireSignIn()) return
    const wasVoted = voted
    const previousCount = count
    setVoted(!wasVoted)
    setCount(previousCount + (wasVoted ? -1 : 1))

    const result = await run()
    if (result.ok) {
      const delta = Number(result.data.voted) - Number(wasVoted)
      setVoted(result.data.voted)
      setCount(result.data.count ?? previousCount + delta)
      return
    }

    // The hook has already toasted (sign-in / restricted / generic).
    setVoted(wasVoted)
    setCount(previousCount)
  }

  const ariaLabel = voted
    ? UI_STRINGS.general.removeVote(label, noun, count)
    : UI_STRINGS.general.addVote(label, noun, count)

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleClick}
        disabled={disabled || state.status === 'pending'}
        aria-pressed={voted}
        aria-label={ariaLabel}
        className={cn(
          'button button-sm subtle gap-1.5',
          voted && 'text-rose-pink',
          className
        )}
      >
        <Heart className={cn(voted && 'text-rose-pink')} />
        <Text>{count}</Text>
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || state.status === 'pending'}
      aria-pressed={voted}
      aria-label={ariaLabel}
      className={cn(
        'group button button-sm subtle gap-1.5 hover:text-rose-pink hover:bg-rose-pink/5 pl-3',
        voted && 'cp-rose',
        className
      )}
    >
      <Heart className={cn(voted && 'fill-rose-pink')} />
      <Text>{label}</Text>
      <Divider orientation='vertical' className='h-4 mx-1' />
      <Text>{count}</Text>
    </Button>
  )
}
