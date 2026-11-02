'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'

/** Reports a failed admin action as a toast, like the other dialogs and forms. */
export function useAdminErrorToast() {
  const { addToast } = useToast()

  return (description?: string) =>
    addToast({ type: 'error', title: ADMIN_STRINGS.updateError, description })
}
