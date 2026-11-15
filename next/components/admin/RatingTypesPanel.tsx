'use client'

import type { RatingTargetType } from '@shared/config/api'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RatingLabel, RatingType } from '@shared/types/ratings.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { useAdminList } from '@/hooks/admin/useAdminList'
import { ApiError } from '@/lib/api/next-api'
import {
  createRatingType,
  getAllRatingTypes,
  removeRatingType,
  renameRatingType,
} from '@/lib/api/ratings-api'
import type { AdminRatingTypesViewModel } from '@/types/components/Admin.types'
import { AdminListStatus } from './AdminListStatus'
import { type NewRatingType, RatingTypeForm } from './RatingTypeForm'
import { RatingTypeItem } from './RatingTypeItem'

const RATING_TYPE_GROUPS: Array<{
  targetType: RatingTargetType
  title: string
}> = [
  { targetType: 'professor', title: ADMIN_STRINGS.professorRatingTypes },
  { targetType: 'subject', title: ADMIN_STRINGS.subjectRatingTypes },
]

export const RatingTypesPanel = ({
  initialData,
}: {
  initialData: AdminRatingTypesViewModel | null
}) => {
  const { items, setItems, loading, loadError, load } =
    useAdminList<RatingType>(initialData?.ratingTypes ?? null)
  const [saving, setSaving] = useState(false)
  const reportError = useAdminErrorToast()

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

  const create = (ratingType: NewRatingType) =>
    mutate(() =>
      createRatingType(ratingType).then(({ rating_type: created }) =>
        setItems((current) =>
          [...current, created].sort((a, b) => a.id.localeCompare(b.id))
        )
      )
    )

  const rename = (id: string, labels: RatingLabel) =>
    mutate(() =>
      renameRatingType(id, labels).then(({ rating_type: updated }) =>
        setItems((current) =>
          current.map((item) => (item.id === id ? updated : item))
        )
      )
    )

  const remove = (id: string) =>
    mutate(
      () =>
        removeRatingType(id).then(() =>
          setItems((current) => current.filter((item) => item.id !== id))
        ),
      (error) =>
        error instanceof ApiError && error.status === 409
          ? ADMIN_STRINGS.ratingTypeInUse
          : undefined
    )

  return (
    <>
      <RatingTypeForm saving={saving} onCreate={create} />

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={ADMIN_STRINGS.loadError}
        onRetry={() => load(getAllRatingTypes)}
        isEmpty={items.length === 0}
        emptyText={ADMIN_STRINGS.emptyRatingTypes}
      >
        {RATING_TYPE_GROUPS.map(({ targetType, title }) => {
          const group = items.filter((item) => item.target_type === targetType)
          if (group.length === 0) return null
          return (
            <Box as='section' key={targetType} className='ui-stack gap-3'>
              <SectionHeader title={title} count={group.length} />
              <Box className='ui-card-grid-fill items-start'>
                {group.map((ratingType) => (
                  <RatingTypeItem
                    key={ratingType.id}
                    ratingType={ratingType}
                    saving={saving}
                    onRename={(labels) => rename(ratingType.id, labels)}
                    onDelete={() => remove(ratingType.id)}
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
