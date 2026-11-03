'use client'

import { TOAST_TIMEOUT } from '@shared/config/next-constants'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { Z_INDEX } from '@/styles/style'
import { cn } from '../../../lib/common-utils'
import { Box } from '../../common/Box'
import { Toast } from './Toast'

/** A component that renders a stack of toasts. */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    // A live region, because a toast is the only report a mutation gives: without
    // one, a screen reader user gets no answer at all to a save or a failed
    // upload. Polite, so it waits for the current sentence instead of cutting in.
    <Box
      role='status'
      aria-live='polite'
      aria-atomic='false'
      className={cn(
        // The region spans a column of toasts but not the page: only the toasts
        // themselves take pointer events, so the empty part of it cannot sit
        // over a control.
        'fixed top-4 right-4 space-y-2 transition pointer-events-none *:pointer-events-auto',
        Z_INDEX.TOASTER
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast?.id}
          toast={{
            ...toast,
            duration: toast?.duration ?? TOAST_TIMEOUT,
          }}
          onDismiss={removeToast}
        />
      ))}
    </Box>
  )
}
