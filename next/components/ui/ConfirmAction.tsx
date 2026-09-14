'use client'

import { type ReactNode, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { Dialog } from './Dialog'

type ConfirmActionProps = {
  title: PortableTextType | ReactNode
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
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  trigger,
}: ConfirmActionProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setIsOpen(false)
  }

  return (
    <>
      {trigger(() => setIsOpen(true))}
      <Dialog
        title={title}
        hideTrigger
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dialogProps={{ className: 'p-6 md:min-w-md' }}
      >
        <Box className='ui-stack gap-4 pt-3'>
          <Text className='ui-body text-grey-500'>{description}</Text>
          <Box className='ui-cluster justify-end gap-2'>
            <Button
              onClick={() => setIsOpen(false)}
              className='button basic ui-caption px-3 py-1.5'
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={handleConfirm}
              className={cn(
                'button ui-caption px-3 py-1.5',
                destructive ? 'danger' : 'solid'
              )}
            >
              {confirmLabel}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  )
}
