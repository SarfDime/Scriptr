'use client'

import { TOAST_VARIANTS } from '@shared/config/next-constants'
import { useToastAnimation } from '../../../hooks/useToastAnimation'
import { cn } from '../../../lib/common-utils'
import type { ToastComponentProps } from '../../../types/components/Toast.types'
import { Box } from '../../common/Box'
import { CloseButton } from '../CloseButton'
import { ToastAction } from './ToastAction'
import { ToastContent } from './ToastContent'

/** A single toast component that displays a message to the user. */
export const Toast = ({ toast, onDismiss }: ToastComponentProps) => {
  const { isExiting, startExitAnimation } = useToastAnimation({
    duration: toast?.duration,
    onDismiss,
    id: toast?.id,
  })

  const toastClass = cn(
    TOAST_VARIANTS[toast.type],
    'relative flex w-100 select-none flex-col rounded-md px-2 py-2 text-background-100 shadow-md transition-all duration-300',
    isExiting ? 'translate-x-[110%] opacity-0' : 'animate-toast-enter',
    (toast.onClick || toast.href) && 'hover:opacity-90'
  )

  return (
    <ToastAction toast={toast}>
      <Box className={toastClass}>
        <ToastContent toast={toast} />
        <CloseButton
          onClick={startExitAnimation}
          className='button absolute top-0 right-0 bottom-0 z-50 my-auto rounded-md p-0 px-4 text-2xl duration-200 hover:rounded-md hover:bg-background-100/25 hover:opacity-75'
        />
      </Box>
    </ToastAction>
  )
}
