'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import type { ScriptPreviewButtonProps } from '@/types/components/Scripts.types'
import { PreviewScriptModal } from '../PreviewScriptModal'

/** Preview action for a single script — opens `PreviewScriptModal`, which
 * shows the title/description and either an inline single-file preview or
 * a per-file download list. Was previously a stub with a "wire up a
 * preview mode" TODO; this is that wiring. */
export const ScriptPreviewButton = ({
  id,
  title,
  description,
  files,
  className,
  children,
  onClick,
  ...props
}: ScriptPreviewButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        {...props}
        onClick={(event) => {
          onClick?.(event)
          setIsOpen(true)
        }}
        className={cn('button button-sm solid', className)}
        data-script-id={id}
      >
        {children ?? UI_STRINGS.scripts.actions.preview}
      </Button>
      <PreviewScriptModal
        scriptId={id}
        title={title}
        description={description}
        files={files}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
