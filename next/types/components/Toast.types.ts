type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastAnimationProps = {
  id: string
  onDismiss: (id: string) => void
  duration: number
}
type ToastData = {
  id: string
  type: ToastType
  title: string
  description?: string
  href?: string
  onClick?: () => void
} & Omit<ToastAnimationProps, 'onDismiss'>

type ToastComponentProps = {
  toast: ToastData & { duration: number }
} & Omit<ToastAnimationProps, 'duration' | 'id'>

export type { ToastAnimationProps, ToastComponentProps, ToastData, ToastType }
