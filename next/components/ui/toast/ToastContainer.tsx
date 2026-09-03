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
    <Box
      className={cn(
        'fixed top-4 right-4 space-y-2 transition',
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
