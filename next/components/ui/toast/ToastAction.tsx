import type { ToastData } from '../../../types/components/Toast.types'
import { Button } from '../../common/Button'
import { NextLink } from '../../common/NextLink'

/** A component that wraps a toast action (e.g. a button or link) with the
 * correct element and props depending on the presence of `href` or `onClick`
 * in the `toast` object. If `href` is present, a `NextLink` will be used,
 * if `onClick` is present, a `Button` will be used, otherwise a
 * `Fragment` will be used.
 */
export const ToastAction = ({
  toast,
  children,
}: {
  toast: ToastData
  children: React.ReactNode
}) => {
  if (toast.href) {
    return <NextLink href={toast.href}>{children}</NextLink>
  }

  if (toast.onClick) {
    return <Button onClick={toast.onClick}>{children}</Button>
  }

  return <>{children}</>
}
