'use client'

import { validateEmailAddress, validatePassword } from '@shared/utils/api.utils'
import { type SubmitEvent, useState } from 'react'
import {
  type FieldFeedback,
  getFieldFeedback,
  useTouchedFields,
} from '@/hooks/auth/useTouchedFields'
import { applyStoredStudySetup } from '@/lib/study-setup-sync'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type LoginFormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

export type LoginField = 'email' | 'password'

const LOGIN_FIELDS: ReadonlyArray<LoginField> = ['email', 'password']

/** Owns login form field state; the actual request goes through
 * SessionProvider's `login` so the rest of the app sees the resulting
 * session update — mirrors useCreateScriptForm's split (form state here,
 * the actual mutation delegated elsewhere). */
export function useLoginForm() {
  const ui = useUIStrings()
  const { login, refresh } = useSession()
  const { addToast } = useToast()
  const { touch, touchAll, isTouched } = useTouchedFields<LoginField>()

  const [values, setValues] = useState<Record<LoginField, string>>({
    email: '',
    password: '',
  })
  const [state, setState] = useState<LoginFormState>({ status: 'idle' })

  const setField = (field: LoginField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    touch(field)
  }

  // Derived every render, so feedback is realtime without effects.
  const errors: Record<LoginField, string | null> = {
    email: validateEmailAddress(values.email),
    password: validatePassword(values.password),
  }
  const fields: Record<LoginField, FieldFeedback> = {
    email: getFieldFeedback(errors.email, isTouched('email')),
    password: getFieldFeedback(errors.password, isTouched('password')),
  }

  const isBusy = state.status === 'submitting'
  const canSubmit =
    !isBusy && LOGIN_FIELDS.every((field) => errors[field] === null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBusy) return
    if (!canSubmit) {
      touchAll(LOGIN_FIELDS)
      return
    }

    setState({ status: 'submitting' })
    const result = await login({
      email: values.email.trim(),
      password: values.password,
    })

    if (!result.ok) {
      setState({ status: 'error', message: result.message })
      addToast({
        title: ui.auth.login.statuses.errorTitle,
        description: result.message,
        type: 'error',
      })
      return
    }

    // A guest's study setup survives email confirmation: the account only
    // exists after the first sign-in, so that is where it is applied.
    await applyStoredStudySetup()
    await refresh()

    addToast({
      title: ui.auth.login.statuses.successTitle,
      description: ui.auth.login.statuses.successDescription,
      type: 'success',
    })
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
