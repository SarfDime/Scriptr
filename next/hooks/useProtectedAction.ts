'use client'

import { useState } from 'react'
import { ApiError } from '@/lib/api/next-api'

export type ProtectedActionState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'restricted'; message: string }
  | { status: 'error'; message: string }

type ProtectedActionResult<T> = { ok: true; data: T } | { ok: false }

const DEFAULT_RESTRICTED_MESSAGE =
  "This action isn't available right now — your account is currently restricted."

function isRestrictedError(error: unknown): boolean {
  // Per API_DOCUMENTATION.md, a 403 from these routes only ever means a
  // restriction rejection — apiFetch's ApiError carries the status needed
  // to tell that apart from any other failure.
  return error instanceof ApiError && error.status === 403
}

/**
 * Wraps a create/update action that the backend restriction check can
 * reject with a 403. Only wrap actions that are actually
 * restriction-checked per ARCHITECTURE.md §4:
 *   - script / comment / comment-reaction / vote-cast / rating creation
 *   - script / comment / rating update
 * Never wrap: deletes or removes (never restriction-checked), favoriting,
 * or comment likes (explicitly exempt) — wrapping those adds a dead error
 * path that can never actually fire.
 */
export function useProtectedAction<Args extends Array<unknown>, T>(
  action: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<ProtectedActionState>({ status: 'idle' })

  const run = async (...args: Args): Promise<ProtectedActionResult<T>> => {
    setState({ status: 'pending' })

    try {
      const data = await action(...args)
      setState({ status: 'idle' })
      return { ok: true, data }
    } catch (error) {
      if (isRestrictedError(error)) {
        setState({ status: 'restricted', message: DEFAULT_RESTRICTED_MESSAGE })
        return { ok: false }
      }

      setState({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Something went wrong',
      })
      return { ok: false }
    }
  }

  const reset = () => setState({ status: 'idle' })

  return { state, run, reset }
}
