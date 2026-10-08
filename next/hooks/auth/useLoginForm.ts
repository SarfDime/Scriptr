'use client'

import { type SubmitEvent, useState } from 'react'
import { useSession } from '@/providers/SessionProvider'

export type LoginFormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

/** Owns login form field state; the actual request goes through
 * SessionProvider's `login` so the rest of the app sees the resulting
 * session update — mirrors useCreateScriptForm's split (form state here,
 * the actual mutation delegated elsewhere). */
export function useLoginForm() {
  const { login } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<LoginFormState>({ status: 'idle' })

  const isBusy = state.status === 'submitting'
  const canSubmit = !isBusy && email.trim().length > 0 && password.length > 0

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setState({ status: 'submitting' })
    const result = await login({ email: email.trim(), password })

    if (!result.ok) {
      setState({ status: 'error', message: result.message })
      return
    }
  }

  return {
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
