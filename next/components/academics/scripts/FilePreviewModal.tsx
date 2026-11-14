'use client'

import CollapseIcon from '@sanity/icons/Collapse'
import ExpandIcon from '@sanity/icons/Expand'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { FileType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import type { ButtonBaseProps } from '@/components/common/Button'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getPreviewableKind } from '@/lib/file-preview'
import { useStrings, useUIStrings } from '@/providers/locale/use-strings'
import {
  FilePreviewContent,
  StoredFilePreviewContent,
} from './FilePreviewContent'

// Wider than the dialog default so PDFs and images have room; `md:min-w-0`
// cancels the default minimum width.
const PREVIEW_DIALOG_CLASS = 'md:w-[min(64rem,calc(100vw-2rem))] md:min-w-0'
// Fullscreen: the dialog covers the viewport as a flex column, so the content
// takes whatever is left under the header. Below `md` the base dialog already
// fills the screen, so only the `md:` frame needs undoing.
const PREVIEW_FULLSCREEN_DIALOG_CLASS =
  'overflow-hidden open:flex open:flex-col md:top-0 md:h-dvh md:max-h-dvh md:w-screen md:max-w-none md:min-w-0 md:rounded-none md:border-0 md:shadow-none'
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
  triggerButtonProps?: Omit<ButtonBaseProps, 'children'>
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
 *
 * A header button toggles fullscreen: the dialog fills the viewport and the
 * file (PDF, image or text) takes all the space under the header, which keeps
 * the title and the controls. Closing the modal resets it to the windowed size.
 */
export function FilePreviewModal({
  file,
  triggerLabel,
  triggerButtonProps,
  open,
  onOpenChange,
}: FilePreviewModalProps) {
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const ui = useUIStrings()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
          {triggerLabel ?? ui.scripts.actions.preview}
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
        headerActions={
          <Button
            onClick={() => setIsFullscreen((current) => !current)}
            aria-label={
              isFullscreen
                ? strings.preview.exitFullscreen
                : strings.preview.enterFullscreen
            }
            className='button ghost p-1'
          >
            {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </Button>
        }
        dialogProps={{
          className: cn(
            PREVIEW_DIALOG_CLASS,
            isFullscreen && PREVIEW_FULLSCREEN_DIALOG_CLASS
          ),
        }}
        hideTrigger
        isOpen={isOpen}
        onClose={() => {
          setIsFullscreen(false)
          setIsOpen(false)
        }}
      >
        {/* One tree for both sizes, so toggling never remounts (reloads) the PDF.
         * `relative` gives the loading spinner its containing block, so it
         * covers the preview and not the viewport. */}
        <Box
          className={cn(
            'relative bg-background-200 p-4',
            isFullscreen && 'flex min-h-0 flex-1 flex-col p-0'
          )}
        >
          {isOpen &&
            (file.isStoredFile ? (
              <StoredFilePreviewContent
                fileKey={file.url}
                kind={kind}
                fileName={file.fileName}
                fillHeight={isFullscreen}
              />
            ) : (
              <FilePreviewContent
                url={resolvedUrl}
                kind={kind}
                fileName={file.fileName}
                fillHeight={isFullscreen}
              />
            ))}
        </Box>
      </Dialog>
    </>
  )
}
