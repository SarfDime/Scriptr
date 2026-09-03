import { TOAST_ICONS } from '@shared/config/next-constants'
import type { ToastType } from '../../../types/components/Toast.types'

/** A component that renders an icon for a toast notification based on its type. */
export const ToastIcon = ({ type }: { type: ToastType }) => {
  const Icon = TOAST_ICONS[type]
  return <Icon className='h-6 w-6' />
}
