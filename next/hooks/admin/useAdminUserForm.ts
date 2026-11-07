'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AdminProfileListItem,
  UserRole,
} from '@shared/types/profile.types'
import {
  isUserRole,
  validateFullName,
  validateUsername,
} from '@shared/utils/api.utils'
import { type SubmitEvent, useState } from 'react'
import {
  type FieldFeedback,
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import { ApiError } from '@/lib/api/next-api'
import { setProfileRole, updateProfileById } from '@/lib/api/profile-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { useAdminErrorToast } from './useAdminErrorToast'

export type AdminUserField = 'username' | 'fullName'

const ADMIN_USER_FIELDS: ReadonlyArray<AdminUserField> = [
  'username',
  'fullName',
]

/**
 * State and submit flow of the admin edit dialog. The username and name rules
 * are the same `validateUsername`/`validateFullName` the profile form and the
 * API use, and the role goes through its own admin route: two calls, fields
 * first, so a role failure leaves the saved fields in place.
 */
export function useAdminUserForm({
  profile,
  onSaved,
}: {
  profile: AdminProfileListItem
  onSaved: () => void
}) {
  const reportError = useAdminErrorToast()
  const { addToast } = useToast()
  const { touch, touchAll, isTouched } = useTouchedFields<AdminUserField>()

  const initial = {
    username: profile.username,
    fullName: profile.full_name ?? '',
    role: isUserRole(profile.role) ? profile.role : 'student',
  }
  const [values, setValues] = useState(initial)
  // Filled only when the API answers with a 409 for a username — there is no
  // availability lookup while typing, same as the profile form.
  const [takenUsernames, setTakenUsernames] = useState<ReadonlySet<string>>(
    new Set()
  )
  const [saving, setSaving] = useState(false)

  const setField = (field: AdminUserField, value: string) => {
    const nextValue = field === 'username' ? value.toLowerCase() : value
    setValues((current) => ({ ...current, [field]: nextValue }))
    touch(field)
  }

  const setRole = (role: UserRole) =>
    setValues((current) => ({ ...current, role }))

  const errors: Record<AdminUserField, string | null> = {
    username:
      validateUsername(values.username) ??
      (takenUsernames.has(values.username.trim().toLowerCase())
        ? ADMIN_STRINGS.usersUsernameTaken
        : null),
    fullName: validateFullName(values.fullName),
  }
  const fields: Record<AdminUserField, FieldFeedback> = {
    username: getFieldFeedback(errors.username, isTouched('username')),
    fullName: getFieldFeedback(errors.fullName, isTouched('fullName')),
  }

  const canSubmit =
    !saving && ADMIN_USER_FIELDS.every((field) => errors[field] === null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      touchAll(ADMIN_USER_FIELDS)
      return
    }

    setSaving(true)
    const username = values.username.trim()
    try {
      await updateProfileById(profile.id, {
        username,
        full_name: values.fullName.trim(),
      })
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.field === 'username'
      ) {
        setTakenUsernames((current) =>
          new Set(current).add(username.toLowerCase())
        )
        touch('username')
      } else {
        reportError(undefined, error)
      }
      setSaving(false)
      return
    }

    if (values.role !== initial.role) {
      try {
        await setProfileRole(profile.id, values.role)
      } catch (error) {
        reportError(undefined, error)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    addToast({ title: ADMIN_STRINGS.usersEditSaved, type: 'success' })
    onSaved()
  }

  return {
    values,
    setField,
    setRole,
    fields,
    saving,
    canSubmit,
    handleSubmit,
  }
}
