'use client'

import { useRouter } from 'next/navigation'
import { type SubmitEvent, useState } from 'react'
import {
  clearGuestAcademicData,
  readGuestAcademicData,
} from '@/lib/onboarding-storage'
import { getRegistrationAcademicProfile } from '@/lib/profile-sync'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { useSession } from '@/providers/SessionProvider'

export type RegisterFormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'awaiting-confirmation'; message: string }

export function useRegisterForm() {
  const router = useRouter()

  const { register } = useSession()
  const { catalog } = useOnboarding()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<RegisterFormState>({ status: 'idle' })

  const isBusy = state.status === 'submitting'
  const canSubmit =
    !isBusy &&
    fullName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setState({ status: 'submitting' })
    const guestData = readGuestAcademicData()
    const academicProfile = getRegistrationAcademicProfile(catalog, guestData)
    if (guestData.onboardingCompletedAt && !academicProfile) {
      setState({
        status: 'error',
        message:
          'Your academic selections could not be prepared. Please reopen onboarding and try again.',
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
      return
    }

    clearGuestAcademicData()

    // `requiresEmailConfirmation` reflects Supabase's own project setting
    // (data.session === null on signUp) — not something this form decides.
    if (result.requiresEmailConfirmation) {
      setState({ status: 'awaiting-confirmation', message: result.message })
      return
    }
    router.push('/')
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
