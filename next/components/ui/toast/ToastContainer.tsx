'use client'

import { TOAST_TIMEOUT } from '@shared/config/next-constants'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { Z_INDEX } from '@/styles/style'
import { cn } from '../../../lib/common-utils'
import type { ToasterType } from '../../../providers/toaster/ToasterProvider'
import { Box } from '../../common/Box'
import { Toast } from './Toast'

/** A failure interrupts; a success waits for the current sentence. `warning`
 * reports a partial failure (the profile was removed but its login was not), so
 * it interrupts too. Anything new picks one of the two by what it reports. */
const ASSERTIVE_TYPES: ReadonlyArray<ToasterType['type']> = ['error', 'warning']

type ToastStackProps = {
  toasts: Array<ToasterType>
  assertive: boolean
  onDismiss: (id: string) => void
}

/** One live region per urgency. Both regions stay mounted, even empty, because
 * a live region only announces content that appears after it exists. */
const ToastStack = ({ toasts, assertive, onDismiss }: ToastStackProps) => (
  <Box
    role={assertive ? 'alert' : 'status'}
    aria-live={assertive ? 'assertive' : 'polite'}
    aria-atomic='false'
    className={cn(
      // Only the toasts themselves take pointer events, so the empty part of
      // the stack cannot sit over a control.
      'space-y-2 empty:hidden pointer-events-none *:pointer-events-auto'
    )}
  >
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        toast={{ ...toast, duration: toast.duration ?? TOAST_TIMEOUT }}
        onDismiss={onDismiss}
      />
    ))}
  </Box>
)

/** A component that renders the stack of toasts: failures first, then the
 * polite ones. A toast is the only report a mutation gives, so without a live
 * region a screen reader user would get no answer at all to a save or a failed
 * upload. */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()
  const assertive = toasts.filter((toast) =>
    ASSERTIVE_TYPES.includes(toast.type)
  )
  const polite = toasts.filter((toast) => !ASSERTIVE_TYPES.includes(toast.type))

  return (
    <Box
      className={cn(
        'fixed top-4 right-4 flex flex-col gap-2 pointer-events-none',
        Z_INDEX.TOASTER
      )}
    >
      <ToastStack toasts={assertive} assertive onDismiss={removeToast} />
      <ToastStack toasts={polite} assertive={false} onDismiss={removeToast} />
    </Box>
  )
}
