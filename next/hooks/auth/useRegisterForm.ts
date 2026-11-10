'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { RegisterConflictField } from '@shared/types/auth.types'
import {
  validateEmailAddress,
  validateFullName,
  validateNewPassword,
  validateUsername,
} from '@shared/utils/api.utils'
import { type SubmitEvent, useState } from 'react'
import {
  type FieldFeedback,
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import { applyStoredStudySetup } from '@/lib/study-setup-sync'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type RegisterFormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'awaiting-confirmation'; message: string }

export type RegisterField = 'fullName' | 'username' | 'email' | 'password'

const REGISTER_FIELDS: ReadonlyArray<RegisterField> = [
  'fullName',
  'username',
  'email',
  'password',
]

export function useRegisterForm() {
  const { register, refresh } = useSession()
  const { addToast } = useToast()
  const { touch, touchAll, isTouched } = useTouchedFields<RegisterField>()

  const [values, setValues] = useState<Record<RegisterField, string>>({
    fullName: '',
    username: '',
    email: '',
    password: '',
  })
  const [state, setState] = useState<RegisterFormState>({ status: 'idle' })
  // Filled only when the server answers a register attempt with a 409 for that
  // field — there are deliberately no availability lookups while typing. Once
  // a value is in here, retyping it is flagged instantly, with no further
  // request.
  const [taken, setTaken] = useState<
    Record<RegisterConflictField, ReadonlySet<string>>
  >({ username: new Set(), email: new Set() })

  const isTaken = (field: RegisterConflictField, value: string) =>
    taken[field].has(value.trim().toLowerCase())

  const setField = (field: RegisterField, value: string) => {
    // Usernames are always lowercase, so normalize as the user types.
    const nextValue = field === 'username' ? value.toLowerCase() : value
    setValues((current) => ({ ...current, [field]: nextValue }))
    touch(field)
  }

  // Derived every render, so feedback is realtime without effects.
  const errors: Record<RegisterField, string | null> = {
    fullName: validateFullName(values.fullName),
    username:
      validateUsername(values.username) ??
      (isTaken('username', values.username)
        ? UI_STRINGS.auth.register.fieldErrors.usernameTaken
        : null),
    email:
      validateEmailAddress(values.email) ??
      (isTaken('email', values.email)
        ? UI_STRINGS.auth.register.fieldErrors.emailTaken
        : null),
    password: validateNewPassword(values.password),
  }
  const fields: Record<RegisterField, FieldFeedback> = {
    fullName: getFieldFeedback(errors.fullName, isTouched('fullName')),
    username: getFieldFeedback(errors.username, isTouched('username')),
    email: getFieldFeedback(errors.email, isTouched('email')),
    password: getFieldFeedback(errors.password, isTouched('password')),
  }

  const isBusy = state.status === 'submitting'
  const canSubmit =
    !isBusy && REGISTER_FIELDS.every((field) => errors[field] === null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy) return
    if (!canSubmit) {
      touchAll(REGISTER_FIELDS)
      const message =
        REGISTER_FIELDS.map((field) => errors[field]).find(
          (error): error is string => error !== null
        ) ?? UI_STRINGS.auth.register.statuses.incompleteForm
      setState({ status: 'error', message })
      addToast({
        title: UI_STRINGS.auth.register.statuses.errorTitle,
        description: message,
        type: 'error',
      })
      return
    }

    setState({ status: 'submitting' })
    const result = await register({
      email: values.email.trim(),
      password: values.password,
      username: values.username.trim(),
      full_name: values.fullName.trim(),
    })

    // A register 409 names the field (username or email) that is taken.
    if (!result.ok && result.field) {
      const { field } = result
      const value = values[field].trim().toLowerCase()
      setTaken((current) => ({
        ...current,
        [field]: new Set(current[field]).add(value),
      }))
      touch(field)
      setState({ status: 'idle' })
      return
    }

    if (!result.ok) {
      setState({ status: 'error', message: result.message })
      addToast({
        title: UI_STRINGS.auth.register.statuses.errorTitle,
        description: result.message,
        type: 'error',
      })
      return
    }

    // `requiresEmailConfirmation` reflects Supabase's own project setting
    // (data.session === null on signUp) — not something this form decides.
    if (result.requiresEmailConfirmation) {
      setState({ status: 'awaiting-confirmation', message: result.message })
      addToast({
        title: UI_STRINGS.auth.register.statuses.successTitle,
        description: result.message,
        type: 'success',
      })
      return
    }

    // The study setup a guest did in this browser is applied to the account
    // here, through the study-scoped endpoints — registration itself carries no
    // academic profile. With confirmation pending there is no session to write
    // with yet, so the records stay and the next sign-in applies them.
    await applyStoredStudySetup()
    await refresh()

    addToast({
      title: UI_STRINGS.auth.register.statuses.successTitle,
      description: UI_STRINGS.auth.register.statuses.successDescription,
      type: 'success',
    })
    setState({ status: 'idle' })
  }

  return {
    values,
    setField,
    touch,
    fields,
    isBusy,
    canSubmit,
    state,
    handleSubmit,
  }
}
