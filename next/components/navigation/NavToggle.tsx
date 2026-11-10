'use client'

import { cn } from '@/lib/common-utils'
import { useNav } from '@/providers/nav/NavProvider'
import type { OmitProps } from '@/types/component.types'
import { Button, type ButtonProps } from '../common/Button'

type NavToggleProps = {
  action: 'open' | 'close'
} & OmitProps<ButtonProps, 'onClick'>

/**
 * The only client-side piece of the navbar chrome: a button that shows or
 * hides it. Everything else reacts to the state through CSS.
 */
export const NavToggle = ({ action, className, ...rest }: NavToggleProps) => {
  const { openNav, closeNav, collapsed } = useNav()

  return (
    <Button
      className={cn('button ghost p-1.5', className)}
      aria-expanded={!collapsed}
      {...rest}
      onClick={action === 'open' ? openNav : closeNav}
    />
  )
}
