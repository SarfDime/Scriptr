'use client'

import type { RatingTargetType } from '@shared/config/api'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RatingLabel } from '@shared/types/ratings.types'
import { trimRatingLabel } from '@shared/utils/rating-label.utils'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import {
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import {
  validateRatingTypeId,
  validateRatingTypeLabel,
  validateRatingTypeLabels,
} from '@/lib/admin-validation'
import type { SelectOptionType } from '@/types/components/Select.types'

type RatingTypeField = 'id' | 'labels'

const TARGET_OPTIONS: Array<SelectOptionType<RatingTargetType>> = [
  { id: 'professor', value: 'professor', label: ADMIN_STRINGS.professor },
  { id: 'subject', value: 'subject', label: ADMIN_STRINGS.subject },
]

export type NewRatingType = {
  id: string
  labels: RatingLabel
  target_type: RatingTargetType
}

/** `onCreate` resolves to whether the rating type was saved; the form clears
 * itself only then, so a failed attempt keeps what was typed. */
export const RatingTypeForm = ({
  saving,
  onCreate,
}: {
  saving: boolean
  onCreate: (ratingType: NewRatingType) => Promise<boolean>
}) => {
  const [id, setId] = useState('')
  const [labels, setLabels] = useState<RatingLabel>({})
  const [targetType, setTargetType] = useState<RatingTargetType>('professor')
  const { touch, touchAll, isTouched } = useTouchedFields<RatingTypeField>()

  const idError = validateRatingTypeId(id)
  // One language may stay empty; at least one has to be written.
  const labelsError = validateRatingTypeLabels(labels)
  const showLabelsError = labelsError !== null && isTouched('labels')

  const setLabel = (locale: 'en' | 'mk', value: string) => {
    setLabels((current) => ({ ...current, [locale]: value }))
    touch('labels')
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    touchAll(['id', 'labels'])
    if (idError || labelsError) return

    onCreate({
      id,
      labels: trimRatingLabel(labels),
      target_type: targetType,
    }).then((created) => {
      if (!created) return
      setId('')
      setLabels({})
    })
  }

  return (
    <Box className='ui-stack ui-above relative has-[[data-open=true]]:z-20'>
      <SectionHeader title={ADMIN_STRINGS.createRatingType} />
      <FormContainer onSubmit={handleSubmit} className='ui-stack gap-4'>
        <InputWrapper
          label={ADMIN_STRINGS.ratingTypeId}
          labelProps={{ htmlFor: 'rating-type-id' }}
          inputProps={{
            id: 'rating-type-id',
            autoComplete: 'off',
            required: true,
            disabled: saving,
            'aria-invalid': getFieldFeedback(idError, isTouched('id')).invalid,
            onBlur: () => touch('id'),
          }}
          inputVal={id}
          inputOnChange={(event) => {
            setId(event.target.value)
            touch('id')
          }}
          {...getFieldFeedback(idError, isTouched('id'))}
        />
        <Box className='ui-stack gap-3'>
          <InputWrapper
            label={ADMIN_STRINGS.labelEnglish}
            labelProps={{ htmlFor: 'rating-type-label-en' }}
            inputProps={{
              id: 'rating-type-label-en',
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
            labelProps={{ htmlFor: 'rating-type-label-mk' }}
            inputProps={{
              id: 'rating-type-label-mk',
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
          {showLabelsError ? (
            <Text className='ui-caption' role='alert'>
              {labelsError}
            </Text>
          ) : (
            <Text className='ui-caption'>
              {ADMIN_STRINGS.ratingTypeLanguagesNote}
            </Text>
          )}
        </Box>
        <Field label={ADMIN_STRINGS.targetType}>
          <Select<RatingTargetType>
            defaultOption={TARGET_OPTIONS[0]}
            options={TARGET_OPTIONS}
            setSelectedValue={setTargetType}
            disabled={saving}
            triggerProps={{ 'aria-label': ADMIN_STRINGS.targetType }}
          />
        </Field>
        <Button type='submit' isLoading={saving} className='button solid w-fit'>
          {ADMIN_STRINGS.save}
        </Button>
      </FormContainer>
    </Box>
  )
}
