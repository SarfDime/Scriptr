'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RatingLabel, RatingType } from '@shared/types/ratings.types'
import { firstFilledLocalizedText } from '@shared/utils/localized-strings'
import { trimRatingLabel } from '@shared/utils/rating-label.utils'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import {
  validateRatingTypeLabel,
  validateRatingTypeLabels,
} from '@/lib/admin-validation'

type RatingTypeItemProps = {
  ratingType: RatingType
  saving: boolean
  /** Resolves to whether the new labels were saved. */
  onRename: (labels: RatingLabel) => Promise<boolean>
  onDelete: () => void
}

/** The admin screens have no reader of their own, so the name shown is the
 *  English one, or the Macedonian one when that is all the criterion has. */
export const RatingTypeItem = ({
  ratingType,
  saving,
  onRename,
  onDelete,
}: RatingTypeItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [labels, setLabels] = useState<RatingLabel>(ratingType.labels)
  const labelsError = validateRatingTypeLabels(labels)
  const name = firstFilledLocalizedText(ratingType.labels)

  const startEditing = () => {
    setLabels(ratingType.labels)
    setIsEditing(true)
  }

  const setLabel = (locale: 'en' | 'mk', value: string) => {
    setLabels((current) => ({ ...current, [locale]: value }))
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (labelsError) return
    onRename(trimRatingLabel(labels)).then((renamed) => {
      if (renamed) setIsEditing(false)
    })
  }

  return (
    <Box as='article' className='ui-stack ui-above'>
      {isEditing ? (
        <FormContainer onSubmit={handleSubmit} className='ui-stack gap-3'>
          <InputWrapper
            label={ADMIN_STRINGS.labelEnglish}
            labelProps={{ htmlFor: `rating-type-${ratingType.id}-label-en` }}
            inputProps={{
              id: `rating-type-${ratingType.id}-label-en`,
              autoComplete: 'off',
              disabled: saving,
            }}
            inputVal={labels.en ?? ''}
            inputOnChange={(event) => setLabel('en', event.target.value)}
            {...getFieldFeedback(
              validateRatingTypeLabel(labels.en ?? ''),
              true
            )}
          />
          <InputWrapper
            label={ADMIN_STRINGS.labelMacedonian}
            labelProps={{ htmlFor: `rating-type-${ratingType.id}-label-mk` }}
            inputProps={{
              id: `rating-type-${ratingType.id}-label-mk`,
              autoComplete: 'off',
              disabled: saving,
            }}
            inputVal={labels.mk ?? ''}
            inputOnChange={(event) => setLabel('mk', event.target.value)}
            {...getFieldFeedback(
              validateRatingTypeLabel(labels.mk ?? ''),
              true
            )}
          />
          {labelsError ? (
            <Text className='ui-caption' role='alert'>
              {labelsError}
            </Text>
          ) : null}
          <Box className='ui-cluster gap-2'>
            <Button
              type='submit'
              isLoading={saving}
              disabled={saving || labelsError !== null}
              className='button button-sm solid'
            >
              {ADMIN_STRINGS.save}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className='button button-sm subtle'
            >
              {ADMIN_STRINGS.cancel}
            </Button>
          </Box>
        </FormContainer>
      ) : (
        <Box className='ui-cluster items-start justify-between gap-3'>
          <Box className='ui-stack min-w-0 gap-1'>
            <Text className='ui-body-strong'>{name}</Text>
            <Text className='ui-caption'>{ratingType.id}</Text>
          </Box>
        </Box>
      )}

      {!isEditing && (
        <Box className='ui-cluster gap-2'>
          <Button
            onClick={startEditing}
            disabled={saving}
            className='button button-sm subtle'
          >
            {ADMIN_STRINGS.rename}
          </Button>
          <ConfirmAction
            title={ADMIN_STRINGS.confirmDeleteRatingTypeTitle}
            description={ADMIN_STRINGS.confirmDeleteRatingType(name)}
            confirmLabel={ADMIN_STRINGS.delete}
            cancelLabel={ADMIN_STRINGS.cancel}
            onConfirm={onDelete}
            trigger={(open) => (
              <Button
                onClick={open}
                disabled={saving}
                className='button button-sm danger'
              >
                {ADMIN_STRINGS.delete}
              </Button>
            )}
          />
        </Box>
      )}
    </Box>
  )
}
