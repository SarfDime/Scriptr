'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { useRouter } from 'next/navigation'
import { ApiError } from '@/lib/api/next-api'
import { toUserMessage } from '@/lib/user-facing-error'
import { useToast } from '@/providers/toaster/ToasterProvider'

/**
 * Reports a failed admin action as a toast, like the other dialogs and forms.
 *
 * A `401` means the twenty-minute unlock lapsed mid-page: the message says so
 * and a refresh re-renders the layout's unlock gate, so the operator is one
 * code away from carrying on.
 *
 * `description` is the caller's own wording when it has some. Otherwise a
 * rate-limit message (the one rejection the API writes for the reader) is
 * shown, and any other failure stays generic.
 */
export function useAdminErrorToast() {
  const { addToast } = useToast()
  const router = useRouter()

  return (description?: string, error?: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      addToast({
        type: 'error',
        title: ADMIN_STRINGS.updateError,
        description: ADMIN_STRINGS.accessExpired,
      })
      router.refresh()
      return
    }

    addToast({
      type: 'error',
      title: ADMIN_STRINGS.updateError,
      description:
        description ??
        (error === undefined
          ? undefined
          : toUserMessage(error, ADMIN_STRINGS.updateError)),
    })
  }
}
