'use client'

import { ACHIEVEMENT_METRICS } from '@shared/config/achievements'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AchievementDefinition,
  AchievementDefinitionInput,
  AchievementDefinitionPatch,
} from '@shared/types/achievements.types'
import type { AdminStudyOption } from '@shared/types/admin.types'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { useAdminList } from '@/hooks/admin/useAdminList'
import {
  createAchievementDefinition,
  getAchievementDefinitions,
  removeAchievementDefinition,
  updateAchievementDefinition,
} from '@/lib/api/achievement-definitions-api'
import { getAdminStudyOptions } from '@/lib/api/admin-study-roles-api'
import { ApiError } from '@/lib/api/next-api'
import type { AdminAchievementDefinitionsViewModel } from '@/types/components/Admin.types'
import { AchievementDefinitionForm } from './AchievementDefinitionForm'
import { AchievementDefinitionItem } from './AchievementDefinitionItem'
import { AdminListStatus } from './AdminListStatus'

const byThresholdThenId = (
  a: AchievementDefinition,
  b: AchievementDefinition
) => a.threshold - b.threshold || a.id.localeCompare(b.id)

export const AchievementDefinitionsPanel = ({
  initialData,
}: {
  initialData: AdminAchievementDefinitionsViewModel | null
}) => {
  const { items, setItems, loading, loadError, load } =
    useAdminList<AchievementDefinition>(
      initialData?.achievementDefinitions ?? null
    )
  const [saving, setSaving] = useState(false)
  // The scope of a definition is one of the studies the operator can see. A
  // failed read leaves the select empty (create is then blocked) rather than
  // guessing a scope.
  const [studies, setStudies] = useState<Array<AdminStudyOption>>([])
  const reportError = useAdminErrorToast()

  useEffect(() => {
    let active = true
    getAdminStudyOptions()
      .then((result) => {
        if (active) setStudies(result?.studies ?? [])
      })
      .catch(() => {
        if (active) setStudies([])
      })
    return () => {
      active = false
    }
  }, [])

  // Runs one mutation and resolves to whether it succeeded, so the forms know
  // whether to clear themselves.
  const mutate = (
    action: () => Promise<unknown>,
    errorMessage?: (error: unknown) => string | undefined
  ) => {
    setSaving(true)
    return action()
      .then(() => true)
      .catch((error: unknown) => {
        reportError(errorMessage?.(error), error)
        return false
      })
      .finally(() => setSaving(false))
  }

  const isConflict = (error: unknown) =>
    error instanceof ApiError && error.status === 409

  const create = (input: AchievementDefinitionInput) =>
    mutate(
      () =>
        createAchievementDefinition(input).then(
          ({ achievement_definition: created }) =>
            setItems((current) => [...current, created])
        ),
      (error) =>
        isConflict(error) ? ADMIN_STRINGS.achievementIdTaken : undefined
    )

  const update = (id: string, patch: AchievementDefinitionPatch) =>
    mutate(() =>
      updateAchievementDefinition(id, patch).then(
        ({ achievement_definition: updated }) =>
          setItems((current) =>
            current.map((item) => (item.id === id ? updated : item))
          )
      )
    )

  const remove = (id: string) =>
    mutate(
      () =>
        removeAchievementDefinition(id).then(() =>
          setItems((current) => current.filter((item) => item.id !== id))
        ),
      (error) =>
        isConflict(error) ? ADMIN_STRINGS.achievementInUse : undefined
    )

  return (
    <>
      <AchievementDefinitionForm
        studies={studies}
        saving={saving}
        onCreate={create}
      />

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={ADMIN_STRINGS.loadError}
        onRetry={() => load(getAchievementDefinitions)}
        isEmpty={items.length === 0}
        emptyText={ADMIN_STRINGS.emptyAchievementDefinitions}
      >
        {ACHIEVEMENT_METRICS.map((metric) => {
          const group = items
            .filter((item) => item.metric === metric)
            .sort(byThresholdThenId)
          if (group.length === 0) return null
          return (
            <Box as='section' key={metric} className='ui-stack gap-3'>
              <SectionHeader
                title={ADMIN_STRINGS.achievementMetricNames[metric]}
                count={group.length}
              />
              <Box className='ui-card-grid-fill items-start'>
                {group.map((definition) => (
                  <AchievementDefinitionItem
                    key={definition.id}
                    definition={definition}
                    studies={studies}
                    saving={saving}
                    onUpdate={(patch) => update(definition.id, patch)}
                    onDelete={() => remove(definition.id)}
                  />
                ))}
              </Box>
            </Box>
          )
        })}
      </AdminListStatus>
    </>
  )
}
