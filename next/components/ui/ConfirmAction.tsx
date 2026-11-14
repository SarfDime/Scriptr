'use client'

import type { PortableTextValue } from '@shared/types/portable-text.types'
import { type ReactNode, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { useUIStrings } from '@/providers/locale/use-strings'
import { Dialog } from './Dialog'
import { DialogFooter } from './DialogFooter'

export type ConfirmActionProps = {
  title: PortableTextValue | ReactNode
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  trigger: (open: () => void) => React.ReactNode
}

/**
 * Reusable confirmation wrapper for any hard-to-undo action. `trigger` is
 * a render prop so any element can open it, and `onConfirm` only fires
 * once the person explicitly confirms.
 *
 * @example
 * ```tsx
 * <ConfirmAction
 *   title='Delete this subject?'
 *   description='This cannot be undone.'
 *   onConfirm={() => deleteSubject(id)}
 *   trigger={(open) => <Button onClick={open}>Delete</Button>}
 * />
 * ```
 */
export const ConfirmAction = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  trigger,
}: ConfirmActionProps) => {
  const ui = useUIStrings()
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setIsOpen(false)
  }

  return (
    <>
      {trigger(() => setIsOpen(true))}
      {isOpen && (
        <Dialog
          title={title}
          hideTrigger
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          dialogProps={{ className: 'md:min-w-md' }}
        >
          <Box className='ui-stack gap-4 p-5'>
            <Text className='ui-body'>{description}</Text>
            <DialogFooter
              size='sm'
              secondaryLabel={cancelLabel ?? ui.general.cancel}
              onSecondary={() => setIsOpen(false)}
              primaryLabel={confirmLabel ?? ui.general.confirm}
              primaryType='button'
              onPrimary={handleConfirm}
              destructive={destructive}
            />
          </Box>
        </Dialog>
      )}
    </>
  )
}
