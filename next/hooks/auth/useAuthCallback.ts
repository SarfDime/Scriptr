'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useSession } from '@/providers/SessionProvider'

type CallbackState =
  | { status: 'processing' }
  | { status: 'error'; message: string }

/**
 * Parses the URL fragment Supabase's hosted /verify redirect leaves
 * behind — `#access_token=...&refresh_token=...&type=signup` on
 * success, or `#error=...&error_description=...` on failure (e.g. an
 * expired or already-used link) — and exchanges the tokens for a
 * session via SessionProvider. The fragment is read directly from
 * window.location since it never reaches Next.js server-side at all.
 */
export function useAuthCallback() {
  const ui = useUIStrings()
  const router = useRouter()
  const { loginWithTokens } = useSession()
  const [state, setState] = useState<CallbackState>({ status: 'processing' })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Causes multiple callback calls>
  useEffect(() => {
    async function resolveCallback() {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const errorDescription = params.get('error_description')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (errorDescription) {
        return { ok: false as const, message: errorDescription }
      }
      if (!accessToken || !refreshToken) {
        return {
          ok: false as const,
          message: ui.auth.callback.invalidLink,
        }
      }
      return loginWithTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }

    resolveCallback().then((result) => {
      if (result.ok) {
        router.replace('/')
        return
      }
      setState({ status: 'error', message: result.message })
    })
  }, [])

  return state
}
