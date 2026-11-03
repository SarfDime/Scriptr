'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AchievementDefinitionInput } from '@shared/types/achievements.types'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import {
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import { validateAchievementId } from '@/lib/admin-validation'
import {
  AchievementDefinitionFieldNames,
  AchievementDefinitionFields,
  type AchievementDefinitionValues,
  getAchievementDefinitionErrors,
  toAchievementDefinitionPatch,
} from './AchievementDefinitionFields'

type CreateField = 'id' | (typeof AchievementDefinitionFieldNames)[number]

const EMPTY_VALUES: AchievementDefinitionValues = {
  threshold: '',
  metric: 'scripts_uploaded',
  rarity: 'common',
}

/** `onCreate` resolves to whether the achievement was saved; the form clears
 * itself only then, so a failed attempt keeps what was typed. */
export const AchievementDefinitionForm = ({
  saving,
  onCreate,
}: {
  saving: boolean
  onCreate: (input: AchievementDefinitionInput) => Promise<boolean>
}) => {
  const [id, setId] = useState('')
  const [values, setValues] = useState(EMPTY_VALUES)
  const { touch, touchAll, isTouched } = useTouchedFields<CreateField>()

  const idError = validateAchievementId(id)
  const fieldErrors = getAchievementDefinitionErrors(values)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    touchAll(['id', ...AchievementDefinitionFieldNames])
    if (idError || Object.values(fieldErrors).some(Boolean)) return

    onCreate({ id, ...toAchievementDefinitionPatch(values) }).then(
      (created) => {
        if (!created) return
        // Metric and rarity stay as chosen, so a run of similar achievements is quick to add.
        setId('')
        setValues((current) => ({
          ...EMPTY_VALUES,
          metric: current.metric,
          rarity: current.rarity,
        }))
      }
    )
  }

  return (
    <Box className='ui-stack ui-above relative has-data-[open=true]:z-20'>
      <SectionHeader title={ADMIN_STRINGS.createAchievementDefinition} />
      <Text className='ui-caption'>{ADMIN_STRINGS.achievementNotice}</Text>
      <FormContainer onSubmit={handleSubmit} className='ui-stack gap-4'>
        <InputWrapper
          label={ADMIN_STRINGS.achievementId}
          labelProps={{ htmlFor: 'achievement-definition-id' }}
          inputProps={{
            id: 'achievement-definition-id',
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
        <AchievementDefinitionFields
          idPrefix='achievement-definition'
          previewId={id}
          values={values}
          onChange={(patch) =>
            setValues((current) => ({ ...current, ...patch }))
          }
          saving={saving}
          isTouched={isTouched}
          touch={touch}
        />
        <Button type='submit' isLoading={saving} className='button solid w-fit'>
          {ADMIN_STRINGS.save}
        </Button>
      </FormContainer>
    </Box>
  )
}
