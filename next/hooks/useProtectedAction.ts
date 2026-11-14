'use client'

import { useState } from 'react'
import { ApiError } from '@/lib/api/next-api'
import { UserFacingError } from '@/lib/user-facing-error'
import { useAuthModal } from '@/providers/AuthModalProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type ProtectedActionState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'restricted'; message: string }
  | { status: 'error'; message: string }

type ProtectedActionResult<T> = { ok: true; data: T } | { ok: false }

type ProtectedActionOptions = {
  /**
   * Opt in to built-in toast feedback. When set, the hook itself reports
   * failures so callers don't render inline errors:
   *   - restriction rejection (403) → the restricted message
   *   - anything else               → this title + "Please try again."
   * Without it the hook only exposes `state`, as before.
   *
   * Signed-out users never get a toast, with or without this option: they get
   * the login/register modal (see `AuthModalProvider`).
   */
  errorTitle?: string
}

function isRestrictedError(error: unknown): boolean {
  // Per API_DOCUMENTATION.md, a 403 from these routes only ever means a
  // restriction rejection — apiFetch's ApiError carries the status needed
  // to tell that apart from any other failure.
  return error instanceof ApiError && error.status === 403
}

function isUnauthenticatedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

/**
 * Wraps a create/update action that the backend restriction check can
 * reject with a 403. Only wrap actions that are actually
 * restriction-checked per docs/ARCHITECTURE-USERS-AUTH.md:
 *   - script / comment / comment-reaction / vote-cast / rating creation
 *   - script / comment / rating update
 *   - comment likes and flag submission (RLS rejects restricted users)
 * Never wrap: deletes or removes (never restriction-checked) or favoriting —
 * wrapping those adds a dead error path that can never actually fire.
 */
export function useProtectedAction<Args extends Array<unknown>, T>(
  action: (...args: Args) => Promise<T>,
  options?: ProtectedActionOptions
) {
  const ui = useUIStrings()
  const [state, setState] = useState<ProtectedActionState>({ status: 'idle' })
  const { session, refresh, logout } = useSession()
  const { addToast } = useToast()
  const { syncRestriction, openRestrictedModal, restrictionNotice } =
    useNotifications()
  const { open: openAuthModal } = useAuthModal()
  const errorTitle = options?.errorTitle

  const run = async (...args: Args): Promise<ProtectedActionResult<T>> => {
    const currentSession =
      session.status === 'loading' ? await refresh() : session
    if (currentSession.status !== 'authenticated') {
      setState({
        status: 'error',
        message: ui.general.signInRequired,
      })
      openAuthModal()
      return { ok: false }
    }

    // Known-restricted users never reach the API; the server still enforces it.
    if (restrictionNotice) {
      setState({
        status: 'restricted',
        message: ui.general.restrictedAction,
      })
      openRestrictedModal()
      return { ok: false }
    }

    setState({ status: 'pending' })

    let actionError: unknown
    try {
      const data = await action(...args)
      setState({ status: 'idle' })
      return { ok: true, data }
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        const refreshedSession = await refresh()
        if (refreshedSession.status === 'authenticated') {
          try {
            const data = await action(...args)
            setState({ status: 'idle' })
            return { ok: true, data }
          } catch (retryError) {
            if (isUnauthenticatedError(retryError)) {
              await logout()
              setState({
                status: 'error',
                message: ui.general.sessionExpired,
              })
              openAuthModal()
              addToast({
                type: 'error',
                title: errorTitle ?? ui.general.actionUnavailable,
                description: ui.general.sessionExpired,
              })
              return { ok: false }
            }
            actionError = retryError
          }
        } else {
          setState({
            status: 'error',
            message: ui.general.sessionExpired,
          })
          openAuthModal()
          addToast({
            type: 'error',
            title: errorTitle ?? ui.general.actionUnavailable,
            description: ui.general.sessionExpired,
          })
          return { ok: false }
        }
      } else {
        actionError = error
      }
    }

    if (isRestrictedError(actionError)) {
      syncRestriction()
      setState({
        status: 'restricted',
        message: ui.general.restrictedAction,
      })
      openRestrictedModal()
      return { ok: false }
    }

    setState({
      status: 'error',
      message:
        actionError instanceof Error
          ? actionError.message
          : ui.general.unexpectedError,
    })
    if (errorTitle) {
      addToast({
        type: 'error',
        title: errorTitle,
        // A message written for the user (such as which file is too large) is
        // shown as it is; anything else gets the generic prompt.
        description:
          actionError instanceof UserFacingError
            ? actionError.message
            : ui.general.tryAgain,
      })
    }
    return { ok: false }
  }

  const reset = () => setState({ status: 'idle' })

  return { state, run, reset }
}
