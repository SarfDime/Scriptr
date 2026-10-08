'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { FileType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import type { ButtonProps } from '@/components/common/Button'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getPreviewableKind } from '@/lib/file-preview'
import {
  FilePreviewContent,
  StoredFilePreviewContent,
} from './FilePreviewContent'

// Wider than the dialog default so PDFs and images have room; `md:min-w-0`
// cancels the default minimum width.
const PREVIEW_DIALOG_CLASS = 'md:w-[min(64rem,calc(100vw-2rem))] md:min-w-0'
const PREVIEW_HEADER_CLASS = 'bg-background-200 py-3'

// Either an already-uploaded remote file (ScriptDetailPage, PreviewScriptModal)
// or a local File the user just picked, not yet uploaded (CreateScriptModal).
// Exactly one of `url`/`localFile` is expected — the component resolves
// whichever is present, generating (and revoking) an object URL for the
// local case via `useObjectUrl`.
export type FilePreviewSource =
  | { url: string; localFile?: undefined; isStoredFile?: boolean }
  | { url?: undefined; localFile: File; isStoredFile?: false }

export type FilePreviewFile = FilePreviewSource & {
  fileName: string
  fileType: FileType
}

export type FilePreviewModalProps = {
  file: FilePreviewFile
  triggerLabel?: string
  triggerButtonProps?: Omit<ButtonProps, 'children'>
  /** Controlled mode: when `open` is provided the modal renders no trigger of
   * its own — the caller opens it (e.g. from a thumbnail) and hears about
   * closing through `onOpenChange`. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Click-to-open preview for a single file, reused across ScriptDetailPage's
 * file list, CreateScriptModal's not-yet-uploaded file list, and
 * PreviewScriptModal's multi-file fallback. Renders nothing if the file
 * isn't a previewable type — callers can render it unconditionally without
 * their own `getPreviewableKind` guard, though most already gate on it to
 * decide whether to render at all vs. download-only.
 */
export function FilePreviewModal({
  file,
  triggerLabel,
  triggerButtonProps,
  open,
  onOpenChange,
}: FilePreviewModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const objectUrl = useObjectUrl(file.localFile ?? null)
  const resolvedUrl = file.url ?? objectUrl
  const kind = getPreviewableKind(file.fileType)
  const color = getColorPalette({ type: 'seed', value: file.fileType })

  if (!kind || !resolvedUrl) return null

  const { onClick, ...buttonProps } = triggerButtonProps ?? {}

  return (
    <>
      {!isControlled && (
        <Button
          {...buttonProps}
          onClick={(event) => {
            onClick?.(event)
            if (!event.defaultPrevented) setIsOpen(true)
          }}
          className={cn(
            'button button-sm hollow px-3 py-1.5',
            buttonProps.className
          )}
        >
          {triggerLabel ?? UI_STRINGS.scripts.actions.preview}
        </Button>
      )}
      <Dialog
        title={
          <span className='inline-flex min-w-0 items-center gap-2'>
            <span className='truncate'>{file.fileName}</span>
            <Badge colorPalette={color}>{file.fileType.toUpperCase()}</Badge>
          </span>
        }
        headerProps={{ className: PREVIEW_HEADER_CLASS }}
        dialogProps={{ className: PREVIEW_DIALOG_CLASS }}
        hideTrigger
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <Box className='bg-background-200 p-4'>
          {isOpen &&
            (file.isStoredFile ? (
              <StoredFilePreviewContent
                fileKey={file.url}
                kind={kind}
                fileName={file.fileName}
              />
            ) : (
              <FilePreviewContent
                url={resolvedUrl}
                kind={kind}
                fileName={file.fileName}
              />
            ))}
        </Box>
      </Dialog>
    </>
  )
}
