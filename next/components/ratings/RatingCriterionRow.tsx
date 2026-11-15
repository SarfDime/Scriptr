'use client'

import { RATING_STRINGS_PACK } from '@shared/strings/ratings-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import type {
  RatingStat,
  RatingTarget,
  RatingType,
} from '@shared/types/ratings.types'
import { resolveRatingLabel } from '@shared/utils/rating-label.utils'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import {
  type ProtectedActionState,
  useProtectedAction,
} from '@/hooks/useProtectedAction'
import { deleteRating, postRating } from '@/lib/api/ratings-api'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings, useUIStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { RatingScoreInput } from './RatingScoreInput'

type RatingStrings = ResolvedStrings<typeof RATING_STRINGS_PACK>

/** The text beside the label. A pending save/remove replaces the aggregate in
 * place, so the row doesn't change while a request is in flight. */
function getCaption(
  strings: RatingStrings,
  saving: boolean,
  removing: boolean,
  stat: RatingStat | undefined
) {
  if (saving) return strings.saving
  if (removing) return strings.removing
  if (stat && stat.count > 0) {
    return strings.summary(stat.average, stat.count)
  }
  return strings.noRatingsYet
}

function getErrorMessage(
  strings: RatingStrings,
  restriction: string,
  saveStatus: ProtectedActionState['status'],
  removeFailed: boolean,
  label: string
) {
  if (saveStatus === 'restricted') return restriction
  if (saveStatus === 'error') return strings.saveFailed(label)
  if (removeFailed) return strings.removeFailed(label)
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
  const { locale } = useLocale()
  const ui = useUIStrings()
  const strings = useStrings(RATING_STRINGS_PACK)
  const [removing, setRemoving] = useState(false)
  const [removeFailed, setRemoveFailed] = useState(false)
  const save = useProtectedAction((score: number) =>
    postRating(target, ratingType.id, score)
  )

  // The criterion's name is data, stored per language; every sentence around it
  // reads it as the reader's own.
  const label = resolveRatingLabel(ratingType.labels, locale)
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
    addToast({ type: 'success', title: strings.saved(label) })
  }

  const handleRemove = async () => {
    if (busy) return
    save.reset()
    setRemoveFailed(false)
    setRemoving(true)
    try {
      await deleteRating(target, ratingType.id)
      onScoreChange(ratingType.id, null)
      addToast({ type: 'success', title: strings.removed(label) })
    } catch {
      setRemoveFailed(true)
    } finally {
      setRemoving(false)
    }
  }

  const caption = getCaption(strings, saving, removing, stat)
  const errorMessage = getErrorMessage(
    strings,
    ui.general.restrictedAction,
    save.state.status,
    removeFailed,
    label
  )

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
                aria-label={strings.removeAria(label)}
                isLoading={removing}
                disabled={busy}
                onClick={handleRemove}
              >
                {strings.remove}
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
