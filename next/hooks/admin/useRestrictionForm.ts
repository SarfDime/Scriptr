'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RestrictionLookupResponse } from '@shared/types/restrictions.types'
import { type SubmitEvent, useState } from 'react'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import { applyRestriction } from '@/lib/api/restrictions-api'
import { useAdminErrorToast } from './useAdminErrorToast'

const REASON_MIN_LENGTH = 3
const REASON_MAX_LENGTH = 500

/** State and submit flow of the restrict dialog. The reason limits are the
 * same ones `PUT /restrictions/:profileId` enforces. */
export function useRestrictionForm({
  lookup,
  onApplied,
}: {
  lookup: RestrictionLookupResponse
  onApplied: () => void
}) {
  const [reason, setReason] = useState(lookup.active_restriction?.reason ?? '')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const reportError = useAdminErrorToast()

  const length = reason.trim().length
  const error =
    length < REASON_MIN_LENGTH || length > REASON_MAX_LENGTH
      ? ADMIN_STRINGS.reasonValidation
      : null

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (error) return

    setSaving(true)
    applyRestriction(lookup.profile.id, reason.trim())
      .then(onApplied)
      .catch(() => {
        reportError()
        setSaving(false)
      })
  }

  return {
    reason,
    setReason: (value: string) => {
      setReason(value)
      setTouched(true)
    },
    touch: () => setTouched(true),
    field: getFieldFeedback(error, touched),
    saving,
    canSubmit: !saving && error === null,
    handleSubmit,
    maxLength: REASON_MAX_LENGTH,
  }
}
