'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { FileType } from '@shared/types/api.types'
import type { ButtonProps } from '@/components/common/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { getPreviewableKind } from '@/lib/file-preview'
import { FilePreviewContent } from './FilePreviewContent'

// Either an already-uploaded remote file (ScriptDetailPage, PreviewScriptModal)
// or a local File the user just picked, not yet uploaded (CreateScriptModal).
// Exactly one of `url`/`localFile` is expected — the component resolves
// whichever is present, generating (and revoking) an object URL for the
// local case via `useObjectUrl`.
export type FilePreviewSource =
  | { url: string; localFile?: undefined }
  | { url?: undefined; localFile: File }

export type FilePreviewFile = FilePreviewSource & {
  fileName: string
  fileType: FileType
}

export type FilePreviewModalProps = {
  file: FilePreviewFile
  triggerLabel?: string
  triggerButtonProps?: Omit<ButtonProps, 'children'>
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
}: FilePreviewModalProps) {
  const objectUrl = useObjectUrl(file.localFile ?? null)
  const resolvedUrl = file.url ?? objectUrl
  const kind = getPreviewableKind(file.fileType)

  if (!kind || !resolvedUrl) return null

  return (
    <Dialog
      title={file.fileName}
      triggerButtonProps={{
        children: triggerLabel ?? UI_STRINGS.scripts.actions.preview,
        className: 'button outline px-3 py-1.5 ui-caption',
        ...triggerButtonProps,
      }}
    >
      <Card.Body>
        <FilePreviewContent
          url={resolvedUrl}
          kind={kind}
          fileName={file.fileName}
        />
      </Card.Body>
    </Dialog>
  )
}
