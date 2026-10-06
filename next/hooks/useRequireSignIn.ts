'use client'

import { useAuthModal } from '@/providers/AuthModalProvider'
import { useSession } from '@/providers/SessionProvider'

/**
 * Returns a guard for UI that needs an account before it does anything
 * (opening an editor, say). Signed-out visitors get the login modal and the
 * guard returns `false`; otherwise it returns `true`. While the session is
 * still loading it lets the action through — the API is the source of truth.
 */
export function useRequireSignIn() {
  const { session } = useSession()
  const { open: openAuthModal } = useAuthModal()

  return (): boolean => {
    if (session.status === 'unauthenticated') {
      openAuthModal()
      return false
    }
    return true
  }
}
