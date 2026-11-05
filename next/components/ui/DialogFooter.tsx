'use client'

import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import { Card } from './Card'

export type DialogFooterProps = {
  /** Replaces the default footer chrome entirely (e.g. a form's own spacing,
   * which also carries a shadow). */
  className?: string
  /** Secondary action (cancel, or clearing a new form). Omit for a single
   * action. */
  secondaryLabel?: string
  onSecondary?: () => void
  secondaryDisabled?: boolean
  /** The primary action's label. */
  primaryLabel: string
  /** Fires for a `button` primary; a `submit` one is handled by the form. */
  onPrimary?: () => void
  /**
   * `submit` (the default) puts the action inside the surrounding form, so
   * Enter submits it. `button` is for a dialog that isn't a form — a
   * confirmation, for example.
   */
  primaryType?: 'submit' | 'button'
  primaryDisabled?: boolean
  primaryLoading?: boolean
  /** Destructive confirmations take the `danger` variant. */
  destructive?: boolean
  /** `sm` matches the compact confirmations; `md` the profile dialogs. */
  size?: 'sm' | 'md'
  /** A line above the actions, e.g. why the form cannot be saved yet. */
  note?: ReactNode
}

/**
 * The action row every dialog ends with: an optional secondary action beside
 * one primary, right-aligned, with the disabled and busy states handled once.
 * Dialogs used to write this by hand, which is how they drifted into three
 * different button sizes and two different paddings.
 */
export const DialogFooter = ({
  className,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
  primaryLabel,
  onPrimary,
  primaryType = 'submit',
  primaryDisabled,
  primaryLoading,
  destructive = false,
  size = 'md',
  note,
}: DialogFooterProps) => {
  const buttonClass = size === 'sm' ? 'button button-sm' : 'button button-md'

  const actions = (
    <>
      {secondaryLabel && (
        <Button
          onClick={onSecondary}
          disabled={secondaryDisabled}
          className={cn(buttonClass, 'subtle')}
        >
          {secondaryLabel}
        </Button>
      )}
      <Button
        type={primaryType}
        onClick={primaryType === 'button' ? onPrimary : undefined}
        disabled={primaryDisabled}
        isLoading={primaryLoading}
        className={cn(buttonClass, destructive ? 'danger' : 'solid')}
      >
        {primaryLabel}
      </Button>
    </>
  )

  return (
    <Card.Footer
      className={cn(
        'shrink-0 px-4 py-3',
        'ui-cluster justify-end gap-2',
        note && 'ui-stack items-stretch',
        className
      )}
    >
      {note}
      {note ? (
        <Box className='ui-cluster justify-end gap-2'>{actions}</Box>
      ) : (
        actions
      )}
    </Card.Footer>
  )
}
