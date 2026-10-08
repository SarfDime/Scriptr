'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import type { PTIconComponent } from './PTicons'

/** An option component for portable text dropdowns */
export const RowButton = ({
  icon: Icon,
  iconClass,
  active = false,
  onClick,
  children,
}: {
  icon?: PTIconComponent
  iconClass?: string
  active?: boolean
  onClick: () => void
  children?: ReactNode
}) => (
  <Button
    onClick={onClick}
    className={cn(
      'flex w-full items-center justify-start gap-1.5 rounded px-2 py-1',
      'text-left text-xs capitalize',
      'button button-sm subtle justify-start rounded border-0 text-left shadow-none outline-0',
      active && 'bg-brand-350 text-background'
    )}
  >
    {Icon ? (
      <Icon
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center',
          iconClass
        )}
      />
    ) : null}
    {children && <span className='truncate'>{children}</span>}
  </Button>
)
