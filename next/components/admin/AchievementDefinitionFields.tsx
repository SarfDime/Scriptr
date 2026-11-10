'use client'

import {
  ACHIEVEMENT_COPY,
  ACHIEVEMENT_METRICS,
  ACHIEVEMENT_RARITIES,
  type AchievementMetric,
  type AchievementRarity,
} from '@shared/config/achievements'
import { ACHIEVEMENTS_STRINGS } from '@shared/strings/achievements-strings'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AchievementDefinitionPatch } from '@shared/types/achievements.types'
import { Box } from '@/components/common/Box'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import { validateAchievementThreshold } from '@/lib/admin-validation'
import type { SelectOptionType } from '@/types/components/Select.types'
import { AchievementDefinitionBadge } from './AchievementDefinitionBadge'

export type AchievementDefinitionValues = {
  threshold: string
  metric: AchievementMetric
  rarity: AchievementRarity
}

export type AchievementDefinitionField = 'threshold'

export const AchievementDefinitionFieldNames: Array<AchievementDefinitionField> =
  ['threshold']

const METRIC_OPTIONS: Array<SelectOptionType<AchievementMetric>> =
  ACHIEVEMENT_METRICS.map((metric) => ({
    id: metric,
    value: metric,
    label: ADMIN_STRINGS.achievementMetricNames[metric],
  }))

const RARITY_OPTIONS: Array<SelectOptionType<AchievementRarity>> =
  ACHIEVEMENT_RARITIES.map((rarity) => ({
    id: rarity,
    value: rarity,
    label: ACHIEVEMENTS_STRINGS.rarity[rarity],
  }))

export const getAchievementDefinitionErrors = (
  values: AchievementDefinitionValues
): Record<AchievementDefinitionField, string | null> => ({
  threshold: validateAchievementThreshold(values.threshold),
})

/** Form values in the shape the API takes. Only call once the errors are null. */
export const toAchievementDefinitionPatch = (
  values: AchievementDefinitionValues
): Required<AchievementDefinitionPatch> => ({
  metric: values.metric,
  rarity: values.rarity,
  threshold: Number(values.threshold.trim()),
})

type AchievementDefinitionFieldsProps = {
  /** Prefix that keeps the input ids unique when several forms are on screen. */
  idPrefix: string
  /** Picks the badge's icon, which can be overridden per achievement id. */
  previewId: string
  values: AchievementDefinitionValues
  onChange: (patch: Partial<AchievementDefinitionValues>) => void
  saving: boolean
  isTouched: (field: AchievementDefinitionField) => boolean
  touch: (field: AchievementDefinitionField) => void
}

/**
 * The editable fields of an achievement definition, shared by the create form
 * and the inline editor, with a live preview of the badge (the metric's icon in
 * the rarity's palette, as profiles render it).
 */
export const AchievementDefinitionFields = ({
  idPrefix,
  previewId,
  values,
  onChange,
  saving,
  isTouched,
  touch,
}: AchievementDefinitionFieldsProps) => {
  const errors = getAchievementDefinitionErrors(values)
  // Wording is code-owned; show what the badge will read, or why it cannot be
  // created yet.
  const copy = ACHIEVEMENT_COPY[previewId]

  return (
    <>
      <Field label={ADMIN_STRINGS.achievementCopyField} grouped>
        {copy ? (
          <>
            <Text className='ui-body-strong'>{copy.title}</Text>
            <Text className='ui-body'>{copy.description}</Text>
            <Text className='ui-caption'>
              {ADMIN_STRINGS.achievementCopyManaged}
            </Text>
          </>
        ) : (
          <Text className='ui-caption'>
            {ADMIN_STRINGS.achievementCopyMissing}
          </Text>
        )}
      </Field>
      <InputWrapper
        label={ADMIN_STRINGS.achievementThreshold}
        labelProps={{ htmlFor: `${idPrefix}-threshold` }}
        inputProps={{
          id: `${idPrefix}-threshold`,
          autoComplete: 'off',
          inputMode: 'numeric',
          required: true,
          disabled: saving,
          'aria-invalid': getFieldFeedback(
            errors.threshold,
            isTouched('threshold')
          ).invalid,
          onBlur: () => touch('threshold'),
        }}
        inputVal={values.threshold}
        inputOnChange={(event) => {
          onChange({ threshold: event.target.value })
          touch('threshold')
        }}
        {...getFieldFeedback(errors.threshold, isTouched('threshold'))}
      />
      <Field label={ADMIN_STRINGS.achievementMetric}>
        <Select<AchievementMetric>
          defaultOption={
            METRIC_OPTIONS.find((option) => option.value === values.metric) ??
            METRIC_OPTIONS[0]
          }
          options={METRIC_OPTIONS}
          setSelectedValue={(metric) => onChange({ metric })}
          disabled={saving}
          triggerProps={{ 'aria-label': ADMIN_STRINGS.achievementMetric }}
        />
      </Field>
      <Field label={ADMIN_STRINGS.achievementRarity}>
        <Select<AchievementRarity>
          defaultOption={
            RARITY_OPTIONS.find((option) => option.value === values.rarity) ??
            RARITY_OPTIONS[0]
          }
          options={RARITY_OPTIONS}
          setSelectedValue={(rarity) => onChange({ rarity })}
          disabled={saving}
          triggerProps={{ 'aria-label': ADMIN_STRINGS.achievementRarity }}
        />
      </Field>
      <Box className='ui-cluster gap-2'>
        <Text className='ui-caption'>{ADMIN_STRINGS.achievementPreview}</Text>
        <AchievementDefinitionBadge
          achievementId={previewId}
          metric={values.metric}
          rarity={values.rarity}
        />
      </Box>
    </>
  )
}
