'use client'

import { getAchievementCopy } from '@shared/config/achievements'
import { ACHIEVEMENTS_STRINGS_PACK } from '@shared/strings/achievements-strings'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AchievementDefinition,
  AchievementDefinitionPatch,
} from '@shared/types/achievements.types'
import type { AdminStudyOption } from '@shared/types/admin.types'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { Text } from '@/components/typography/Text'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { resolveAchievementRarity } from '@/lib/achievement-display'
import { useStrings } from '@/providers/locale/use-strings'
import { AchievementDefinitionBadge } from './AchievementDefinitionBadge'
import {
  AchievementDefinitionFields,
  type AchievementDefinitionValues,
  getAchievementDefinitionErrors,
  toAchievementDefinitionPatch,
} from './AchievementDefinitionFields'

type AchievementDefinitionItemProps = {
  definition: AchievementDefinition
  /** The studies a definition can be scoped to, for the editor and the label. */
  studies: Array<AdminStudyOption>
  saving: boolean
  /** Resolves to whether the changes were saved. */
  onUpdate: (patch: AchievementDefinitionPatch) => Promise<boolean>
  onDelete: () => void
}

const valuesOf = (
  definition: AchievementDefinition
): AchievementDefinitionValues => {
  return {
    threshold: String(definition.threshold),
    // The API only accepts known metrics; a row that predates that falls back to
    // the first option in the editor and is corrected on save.
    metric:
      definition.metric in ADMIN_STRINGS.achievementMetricNames
        ? (definition.metric as AchievementDefinitionValues['metric'])
        : 'scripts_uploaded',
    rarity: resolveAchievementRarity(definition.rarity),
    studyId: definition.study_id,
  }
}

export const AchievementDefinitionItem = ({
  definition,
  studies,
  saving,
  onUpdate,
  onDelete,
}: AchievementDefinitionItemProps) => {
  const strings = useStrings(ACHIEVEMENTS_STRINGS_PACK)
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState(() => valuesOf(definition))
  const hasErrors = Object.values(getAchievementDefinitionErrors(values)).some(
    Boolean
  )
  const rarity = resolveAchievementRarity(definition.rarity)
  const copy = getAchievementCopy(definition.id, definition)
  const scopeName = definition.study_id
    ? (studies.find((study) => study.id === definition.study_id)?.name ??
      ADMIN_STRINGS.achievementScopeUnknownStudy)
    : ADMIN_STRINGS.achievementScopePlatform

  const startEditing = () => {
    setValues(valuesOf(definition))
    setIsEditing(true)
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasErrors) return
    onUpdate(toAchievementDefinitionPatch(values)).then((updated) => {
      if (updated) setIsEditing(false)
    })
  }

  return (
    <Box
      as='article'
      className='ui-stack ui-above relative has-data-[open=true]:z-20'
    >
      {isEditing ? (
        <FormContainer onSubmit={handleSubmit} className='ui-stack gap-3'>
          <Text className='ui-caption'>{definition.id}</Text>
          <AchievementDefinitionFields
            idPrefix={`achievement-definition-${definition.id}`}
            previewId={definition.id}
            values={values}
            studies={studies}
            onChange={(patch) =>
              setValues((current) => ({ ...current, ...patch }))
            }
            saving={saving}
            // Existing values are shown with their errors straight away.
            isTouched={() => true}
            touch={() => undefined}
          />
          <Box className='ui-cluster gap-2'>
            <Button
              type='submit'
              isLoading={saving}
              disabled={saving || hasErrors}
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
        <Box className='ui-cluster items-start gap-3'>
          <AchievementDefinitionBadge
            achievementId={definition.id}
            metric={definition.metric}
            rarity={rarity}
          />
          <Box className='ui-stack min-w-0 gap-1'>
            <Text className='ui-body-strong'>{copy.title}</Text>
            <Text className='ui-caption'>
              {definition.id} · {strings.rarity[rarity]} ·{' '}
              {ADMIN_STRINGS.achievementThresholdValue(definition.threshold)} ·{' '}
              {scopeName}
            </Text>
            {copy.description && (
              <Text className='ui-body'>{copy.description}</Text>
            )}
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
            {ADMIN_STRINGS.edit}
          </Button>
          <ConfirmAction
            title={ADMIN_STRINGS.confirmDeleteAchievementTitle}
            description={ADMIN_STRINGS.confirmDeleteAchievement(copy.title)}
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
