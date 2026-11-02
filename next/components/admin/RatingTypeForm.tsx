'use client'

import type { RatingTargetType } from '@shared/config/api'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import {
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import {
  validateRatingTypeId,
  validateRatingTypeLabel,
} from '@/lib/admin-validation'
import type { SelectOptionType } from '@/types/components/Select.types'

type RatingTypeField = 'id' | 'label'

const TARGET_OPTIONS: Array<SelectOptionType<RatingTargetType>> = [
  { id: 'professor', value: 'professor', label: ADMIN_STRINGS.professor },
  { id: 'subject', value: 'subject', label: ADMIN_STRINGS.subject },
]

export type NewRatingType = {
  id: string
  label: string
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
  const [label, setLabel] = useState('')
  const [targetType, setTargetType] = useState<RatingTargetType>('professor')
  const { touch, touchAll, isTouched } = useTouchedFields<RatingTypeField>()

  const errors: Record<RatingTypeField, string | null> = {
    id: validateRatingTypeId(id),
    label: validateRatingTypeLabel(label),
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    touchAll(['id', 'label'])
    if (errors.id || errors.label) return

    onCreate({ id, label: label.trim(), target_type: targetType }).then(
      (created) => {
        if (!created) return
        setId('')
        setLabel('')
      }
    )
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
            'aria-invalid': getFieldFeedback(errors.id, isTouched('id'))
              .invalid,
            onBlur: () => touch('id'),
          }}
          inputVal={id}
          inputOnChange={(event) => {
            setId(event.target.value)
            touch('id')
          }}
          {...getFieldFeedback(errors.id, isTouched('id'))}
        />
        <InputWrapper
          label={ADMIN_STRINGS.label}
          labelProps={{ htmlFor: 'rating-type-label' }}
          inputProps={{
            id: 'rating-type-label',
            autoComplete: 'off',
            required: true,
            disabled: saving,
            'aria-invalid': getFieldFeedback(errors.label, isTouched('label'))
              .invalid,
            onBlur: () => touch('label'),
          }}
          inputVal={label}
          inputOnChange={(event) => {
            setLabel(event.target.value)
            touch('label')
          }}
          {...getFieldFeedback(errors.label, isTouched('label'))}
        />
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
