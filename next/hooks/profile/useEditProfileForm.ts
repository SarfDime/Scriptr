'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { MyProfileResponse } from '@shared/types/profile.types'
import { validateFullName, validateUsername } from '@shared/utils/api.utils'
import { type SubmitEvent, useState } from 'react'
import {
  type FieldFeedback,
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import { ApiError } from '@/lib/api/next-api'
import { updateMyProfile, uploadMyAvatar } from '@/lib/api/profile-api'
import { validateAvatarFile } from '@/lib/profile-avatar'
import { useMyProfileActions } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type EditProfileField = 'fullName' | 'username'

const EDIT_PROFILE_FIELDS: ReadonlyArray<EditProfileField> = [
  'fullName',
  'username',
]

type EditProfileValues = Record<EditProfileField, string>

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : UI_STRINGS.profile.edit.saveFailed

/**
 * State and submit flow for the edit-profile dialog. Validation is the same
 * `validateFullName`/`validateUsername` the register form and the API use.
 *
 * Saving is two independent steps, like the script edit dialog: the text
 * fields (PATCH /profiles/me), then the avatar. `baseline` is what the
 * server holds, and moves forward once the fields save, so retrying after
 * a failed avatar upload doesn't re-send them. Editing a profile is not
 * restriction-checked, so this doesn't go through useProtectedAction.
 */
export function useEditProfileForm({
  profile,
  onSaved,
}: {
  profile: MyProfileResponse
  onSaved: () => void
}) {
  const { reload } = useMyProfileActions()
  const { refresh: refreshSession } = useSession()
  const { addToast } = useToast()
  const { touch, touchAll, isTouched } = useTouchedFields<EditProfileField>()

  const initialValues: EditProfileValues = {
    fullName: profile.full_name ?? '',
    username: profile.username ?? '',
  }
  const [values, setValues] = useState(initialValues)
  const [baseline, setBaseline] = useState(initialValues)
  const [isBusy, setIsBusy] = useState(false)
  // Filled only when the server answers with a 409 for a username — there
  // are no availability lookups while typing, same as the register form.
  const [takenUsernames, setTakenUsernames] = useState<ReadonlySet<string>>(
    new Set()
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const setField = (field: EditProfileField, value: string) => {
    // Usernames are always lowercase, so normalize as the user types.
    const nextValue = field === 'username' ? value.toLowerCase() : value
    setValues((current) => ({ ...current, [field]: nextValue }))
    touch(field)
  }

  const selectAvatar = (file: File | null) => {
    const error = file ? validateAvatarFile(file) : null
    setAvatarError(error)
    setAvatarFile(error ? null : file)
  }

  const errors: Record<EditProfileField, string | null> = {
    fullName: validateFullName(values.fullName),
    username:
      validateUsername(values.username) ??
      (takenUsernames.has(values.username.trim().toLowerCase())
        ? UI_STRINGS.auth.register.fieldErrors.usernameTaken
        : null),
  }
  const fields: Record<EditProfileField, FieldFeedback> = {
    fullName: getFieldFeedback(errors.fullName, isTouched('fullName')),
    username: getFieldFeedback(errors.username, isTouched('username')),
  }

  const hasFieldChanges =
    values.username.trim() !== baseline.username ||
    values.fullName.trim() !== baseline.fullName
  const canSubmit =
    !isBusy &&
    EDIT_PROFILE_FIELDS.every((field) => errors[field] === null) &&
    (hasFieldChanges || avatarFile !== null)

  const toastError = (error: unknown) =>
    addToast({
      title: UI_STRINGS.profile.edit.saveFailed,
      description: getErrorMessage(error),
      type: 'error',
    })

  // The profile page updates in place; the session carries the username
  // too (account card, auth page), so it is re-read as well.
  const refreshViews = () => Promise.all([reload(), refreshSession()])

  const saveFields = async (): Promise<boolean> => {
    const next: EditProfileValues = {
      fullName: values.fullName.trim(),
      username: values.username.trim(),
    }
    try {
      await updateMyProfile({
        username: next.username,
        full_name: next.fullName,
      })
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.field === 'username'
      ) {
        setTakenUsernames((current) =>
          new Set(current).add(next.username.toLowerCase())
        )
        touch('username')
      } else {
        toastError(error)
      }
      return false
    }

    setBaseline(next)
    await refreshViews()
    return true
  }

  const saveAvatar = async (file: File): Promise<boolean> => {
    try {
      await uploadMyAvatar(file)
    } catch (error) {
      toastError(error)
      return false
    }

    setAvatarFile(null)
    await refreshViews()
    return true
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy) return
    if (!canSubmit) {
      touchAll(EDIT_PROFILE_FIELDS)
      return
    }

    setIsBusy(true)
    const fieldsSaved = !hasFieldChanges || (await saveFields())
    const avatarSaved =
      fieldsSaved && (avatarFile === null || (await saveAvatar(avatarFile)))
    setIsBusy(false)
    if (!avatarSaved) return

    addToast({ title: UI_STRINGS.profile.edit.saved, type: 'success' })
    onSaved()
  }

  return {
    values,
    setField,
    touch,
    fields,
    isBusy,
    canSubmit,
    avatarFile,
    avatarError,
    selectAvatar,
    handleSubmit,
  }
}
