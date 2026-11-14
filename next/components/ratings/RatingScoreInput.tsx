'use client'

import Star from '@sanity/icons/Star'
import StarFilled from '@sanity/icons/StarFilled'
import { RATING_STRINGS_PACK } from '@shared/strings/ratings-strings'
import type { KeyboardEvent } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'

const SCORES = [1, 2, 3, 4, 5] as const

/** Where focus goes for a key press, or `null` for keys we don't handle. */
function getNextIndex(key: string, index: number, last: number) {
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return index === last ? 0 : index + 1
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return index === 0 ? last : index - 1
  }
  if (key === 'Home') return 0
  if (key === 'End') return last
  return null
}

type RatingScoreInputProps = {
  /** Criterion label, used for the accessible name. */
  label: string
  /** The viewer's current score, if any. */
  value: number | undefined
  /** Blocks selecting (pending request or restricted account). */
  disabled: boolean
  onSelect: (score: number) => void
}

/**
 * Five-point radiogroup with a roving tab stop. Arrow keys, Home and End only
 * move focus; Enter, Space or a click selects. Selecting sends a request, so
 * (unlike native radios, which select on arrow keys) moving through the options
 * must not.
 *
 * Disabled uses `aria-disabled` rather than `disabled`, so a focused option
 * keeps focus while a request is in flight.
 */
export function RatingScoreInput({
  label,
  value,
  disabled,
  onSelect,
}: RatingScoreInputProps) {
  const strings = useStrings(RATING_STRINGS_PACK)
  const tabStop = value ?? 1

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const options = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]'
      ) ?? []
    )
    const index = options.indexOf(event.currentTarget)
    const nextIndex = getNextIndex(event.key, index, options.length - 1)

    if (nextIndex === null) return
    event.preventDefault()
    options[nextIndex]?.focus()
  }

  return (
    <Box
      role='radiogroup'
      aria-label={strings.groupLabel(label)}
      className='ui-cluster gap-1'
    >
      {SCORES.map((score) => {
        const filled = value !== undefined && score <= value
        const Icon = filled ? StarFilled : Star

        return (
          <Button
            key={score}
            role='radio'
            aria-checked={score === value}
            aria-label={strings.scoreOption(score)}
            aria-disabled={disabled || undefined}
            tabIndex={score === tabStop ? 0 : -1}
            onKeyDown={handleKeyDown}
            onClick={() => {
              if (disabled || score === value) return
              onSelect(score)
            }}
            className={cn(
              'rounded-md p-px transition-colors focus-visible:outline-2',
              filled ? 'text-brand' : 'text-fg-muted',
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:text-brand'
            )}
          >
            <Icon className='overwrite size-5' aria-hidden='true' />
          </Button>
        )
      })}
    </Box>
  )
}
