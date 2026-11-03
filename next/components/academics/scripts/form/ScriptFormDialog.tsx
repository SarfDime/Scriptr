'use client'

import type { ReactNode, SubmitEvent } from 'react'
import { FormContainer } from '@/components/typography/FormContainer'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { useDeviceType } from '@/hooks/useDeviceType'
import {
  SCRIPT_FORM_BODY_CLASS,
  SCRIPT_FORM_DIALOG_CLASS,
  SCRIPT_FORM_FOOTER_CLASS,
} from './script-form-layout'

export type ScriptFormDialogProps = {
  title: string
  isOpen: boolean
  /** The header close button (and the dialog's own close handling). */
  onClose: () => void
  /** The footer's left action: clearing a new form, or cancelling an edit. */
  onSecondaryAction: () => void
  secondaryActionLabel: string
  submitLabel: string
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  isBusy: boolean
  canSubmit: boolean
  children: ReactNode
}

/**
 * The shell both script forms share: dialog chrome, the scrolling sectioned
 * body and the action footer. It owns no form state, so creating a script and
 * editing one keep their own data flows and only share the presentation.
 */
export function ScriptFormDialog({
  title,
  isOpen,
  onClose,
  onSecondaryAction,
  secondaryActionLabel,
  submitLabel,
  onSubmit,
  isBusy,
  canSubmit,
  children,
}: ScriptFormDialogProps) {
  const isMobile = useDeviceType() === 'mobile'

  return (
    <Dialog
      title={title}
      hideTrigger
      isOpen={isOpen}
      onClose={onClose}
      dialogProps={{ className: SCRIPT_FORM_DIALOG_CLASS }}
      // A slip outside the dialog or on Esc would discard a half-filled
      // form, so both are deliberate close-button actions only.
      closeOnOutsideClick={false}
      closeOnEsc={false}
      hideBackdrop={isMobile}
    >
      <FormContainer
        onSubmit={onSubmit}
        className='flex min-h-0 flex-1 flex-col'
      >
        <Card.Body className={SCRIPT_FORM_BODY_CLASS}>{children}</Card.Body>
        <DialogFooter
          className={SCRIPT_FORM_FOOTER_CLASS}
          secondaryLabel={secondaryActionLabel}
          onSecondary={onSecondaryAction}
          secondaryDisabled={isBusy}
          primaryLabel={submitLabel}
          primaryDisabled={!canSubmit}
        />
      </FormContainer>
    </Dialog>
  )
}
