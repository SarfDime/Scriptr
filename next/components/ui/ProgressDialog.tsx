'use client'

import { useState } from 'react'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Dialog } from './Dialog'
import { LoadingSpinner } from './LoadingSpinner'

type ProgressDialogProps = {
  isOpen: boolean
  title: string
  /** What is happening right now. */
  message: string
  hint?: string
}

/**
 * A dialog that can't be dismissed, for work the user has to wait out. There is
 * no close button, and Escape and clicks outside do nothing. It is a native
 * modal, so nothing behind it can be reached either.
 *
 * Browsers only let a page cancel the Escape key once per user gesture: a second
 * press closes the dialog regardless. So when it closes while `isOpen` is still
 * true, it is opened again.
 */
export function ProgressDialog({
  isOpen,
  title,
  message,
  hint,
}: ProgressDialogProps) {
  const [instance, setInstance] = useState(0)

  return (
    <Dialog
      key={instance}
      hideTrigger
      hideCloseButton
      closeOnEsc={false}
      closeOnOutsideClick={false}
      isOpen={isOpen}
      title={title}
      onClose={() => {
        if (isOpen) setInstance((current) => current + 1)
      }}
      dialogProps={{
        role: 'alertdialog',
        'aria-busy': true,
        className: 'md:w-96 md:min-w-0',
      }}
    >
      <Box className='ui-stack items-center justify-center gap-4 px-5 py-10 text-center max-md:min-h-[50dvh]'>
        <LoadingSpinner />
        <Text role='status' aria-live='polite'>
          {message}
        </Text>
        {hint && <Text className='ui-subtitle'>{hint}</Text>}
      </Box>
    </Dialog>
  )
}
