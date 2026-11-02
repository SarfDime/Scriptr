'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { RATING_STRINGS } from '@shared/strings/ratings-strings'
import type {
  RatingStat,
  RatingTarget,
  RatingType,
} from '@shared/types/ratings.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import {
  type ProtectedActionState,
  useProtectedAction,
} from '@/hooks/useProtectedAction'
import { deleteRating, postRating } from '@/lib/api/ratings-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { RatingScoreInput } from './RatingScoreInput'

/** The text beside the label. A pending save/remove replaces the aggregate in
 * place, so the row doesn't change while a request is in flight. */
function getCaption(
  saving: boolean,
  removing: boolean,
  stat: RatingStat | undefined
) {
  if (saving) return RATING_STRINGS.saving
  if (removing) return RATING_STRINGS.removing
  if (stat && stat.count > 0) {
    return RATING_STRINGS.summary(stat.average, stat.count)
  }
  return RATING_STRINGS.noRatingsYet
}

function getErrorMessage(
  saveStatus: ProtectedActionState['status'],
  removeFailed: boolean,
  label: string
) {
  if (saveStatus === 'restricted') return UI_STRINGS.general.restrictedAction
  if (saveStatus === 'error') return RATING_STRINGS.saveFailed(label)
  if (removeFailed) return RATING_STRINGS.removeFailed(label)
  return null
}

type RatingCriterionRowProps = {
  target: RatingTarget
  ratingType: RatingType
  stat: RatingStat | undefined
  /** Guests see the aggregate only. */
  canRate: boolean
  /** Known restricted: can still remove, can't create or change. */
  restricted: boolean
  myScore: number | undefined
  onScoreChange: (ratingTypeId: string, score: number | null) => void
}

/** One criterion: its aggregate and, for signed-in viewers, their own score. */
export function RatingCriterionRow({
  target,
  ratingType,
  stat,
  canRate,
  restricted,
  myScore,
  onScoreChange,
}: RatingCriterionRowProps) {
  const { addToast } = useToast()
  const [removing, setRemoving] = useState(false)
  const [removeFailed, setRemoveFailed] = useState(false)
  const save = useProtectedAction((score: number) =>
    postRating(target, ratingType.id, score)
  )

  const label = ratingType.label
  const saving = save.state.status === 'pending'
  // A 403 on save means the restriction landed after this page loaded.
  const isRestricted = restricted || save.state.status === 'restricted'
  const busy = saving || removing

  const handleSelect = async (score: number) => {
    if (busy || isRestricted) return
    setRemoveFailed(false)
    const result = await save.run(score)
    if (!result.ok) return
    onScoreChange(ratingType.id, score)
    addToast({ type: 'success', title: RATING_STRINGS.saved(label) })
  }

  const handleRemove = async () => {
    if (busy) return
    save.reset()
    setRemoveFailed(false)
    setRemoving(true)
    try {
      await deleteRating(target, ratingType.id)
      onScoreChange(ratingType.id, null)
      addToast({ type: 'success', title: RATING_STRINGS.removed(label) })
    } catch {
      setRemoveFailed(true)
    } finally {
      setRemoving(false)
    }
  }

  const caption = getCaption(saving, removing, stat)
  const errorMessage = getErrorMessage(save.state.status, removeFailed, label)

  return (
    <Box as='li' className='ui-stack gap-0.5' aria-busy={busy || undefined}>
      <Box className='ui-cluster justify-between gap-x-3 gap-y-0.5'>
        <Box className='ui-cluster items-baseline gap-x-2'>
          <Text as='span' className='ui-body'>
            {label}
          </Text>
          <Text as='span' className='ui-caption' aria-live='polite'>
            {caption}
          </Text>
        </Box>

        {canRate && (
          <Box className='ui-cluster gap-1'>
            {myScore !== undefined && (
              <Button
                className='button button-sm danger'
                aria-label={RATING_STRINGS.removeAria(label)}
                isLoading={removing}
                disabled={busy}
                onClick={handleRemove}
              >
                {RATING_STRINGS.remove}
              </Button>
            )}
            <RatingScoreInput
              label={label}
              value={myScore}
              disabled={busy || isRestricted}
              onSelect={handleSelect}
            />
          </Box>
        )}
      </Box>

      {errorMessage && (
        <Text className='ui-caption' role='alert'>
          {errorMessage}
        </Text>
      )}
    </Box>
  )
}
