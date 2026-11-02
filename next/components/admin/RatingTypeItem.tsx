'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RatingType } from '@shared/types/ratings.types'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import { validateRatingTypeLabel } from '@/lib/admin-validation'

type RatingTypeItemProps = {
  ratingType: RatingType
  saving: boolean
  /** Resolves to whether the new label was saved. */
  onRename: (label: string) => Promise<boolean>
  onDelete: () => void
}

export const RatingTypeItem = ({
  ratingType,
  saving,
  onRename,
  onDelete,
}: RatingTypeItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(ratingType.label)
  const error = validateRatingTypeLabel(label)

  const startEditing = () => {
    setLabel(ratingType.label)
    setIsEditing(true)
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (error) return
    onRename(label.trim()).then((renamed) => {
      if (renamed) setIsEditing(false)
    })
  }

  return (
    <Box as='article' className='ui-stack ui-above'>
      {isEditing ? (
        <FormContainer onSubmit={handleSubmit} className='ui-stack gap-3'>
          <InputWrapper
            label={ADMIN_STRINGS.label}
            labelProps={{ htmlFor: `rating-type-${ratingType.id}-label` }}
            inputProps={{
              id: `rating-type-${ratingType.id}-label`,
              autoComplete: 'off',
              required: true,
              disabled: saving,
            }}
            inputVal={label}
            inputOnChange={(event) => setLabel(event.target.value)}
            {...getFieldFeedback(error, true)}
          />
          <Box className='ui-cluster gap-2'>
            <Button
              type='submit'
              isLoading={saving}
              disabled={saving || error !== null}
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
            <Text className='ui-body-strong'>{ratingType.label}</Text>
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
            description={ADMIN_STRINGS.confirmDeleteRatingType(
              ratingType.label
            )}
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
