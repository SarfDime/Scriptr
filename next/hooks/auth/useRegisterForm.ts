'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { validateEmailAddress, validateUsername } from '@shared/utils/api.utils'
import { type SubmitEvent, useState } from 'react'
import {
  clearGuestAcademicData,
  readGuestAcademicData,
} from '@/lib/onboarding-storage'
import { getRegistrationAcademicProfile } from '@/lib/profile-sync'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type RegisterFormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'awaiting-confirmation'; message: string }

export function useRegisterForm() {
  const { register } = useSession()
  const { catalog } = useOnboarding()
  const { addToast } = useToast()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<RegisterFormState>({ status: 'idle' })

  const isBusy = state.status === 'submitting'
  const canSubmit =
    !isBusy &&
    fullName.trim().length > 0 &&
    validateUsername(username.trim()) === null &&
    validateEmailAddress(email.trim()) === null &&
    password.length > 0

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      const usernameError = validateUsername(username.trim())
      const emailError = validateEmailAddress(email.trim())
      setState({
        status: 'error',
        message:
          usernameError ??
          emailError ??
          UI_STRINGS.auth.register.statuses.incompleteForm,
      })
      addToast({
        title: UI_STRINGS.auth.register.statuses.errorTitle,
        description:
          usernameError ??
          emailError ??
          UI_STRINGS.auth.register.statuses.incompleteForm,
        type: 'error',
      })
      return
    }

    setState({ status: 'submitting' })
    const guestData = readGuestAcademicData()
    const academicProfile = getRegistrationAcademicProfile(catalog, guestData)
    if (guestData.onboardingCompletedAt && !academicProfile) {
      setState({
        status: 'error',
        message: UI_STRINGS.auth.register.statuses.academicProfileUnavailable,
      })
      addToast({
        title: UI_STRINGS.auth.register.statuses.errorTitle,
        description:
          UI_STRINGS.auth.register.statuses.academicProfileUnavailable,
        type: 'error',
      })
      return
    }
    const result = await register({
      email: email.trim(),
      password,
      username: username.trim(),
      full_name: fullName.trim(),
      academicProfile: academicProfile ?? undefined,
    })

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

    clearGuestAcademicData()
    addToast({
      title: UI_STRINGS.auth.register.statuses.successTitle,
      description: UI_STRINGS.auth.register.statuses.successDescription,
      type: 'success',
    })
    setState({ status: 'idle' })
  }

  return {
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    isBusy,
    canSubmit,
    state,
    handleSubmit,
  }
}
