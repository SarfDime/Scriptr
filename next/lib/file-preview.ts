import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import type { FileType } from '@shared/types/api.types'

/** The only two kinds this project can render inline. Everything else
 * (images, doc/docx, xls/xlsx) falls back to download-only. */
export type PreviewableFileKind = 'pdf' | 'text'

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

/** Whether an already-typed file (e.g. a persisted `ScriptFileSummary`) can
 * be rendered inline, and if so, which renderer to use. */
export function getPreviewableKind(
  fileType: FileType
): PreviewableFileKind | null {
  if (fileType === 'pdf') return 'pdf'
  if (fileType === 'md') return 'text'
  return null
}

/** Validates a raw filename's extension against the project's allowed
 * upload types and narrows it to `FileType`, or `null` if unsupported.
 * Mirrors the validation `CreateScriptModal` already does before upload —
 * use this for local `File` objects that don't have a `FileType` yet. */
export function getFileTypeFromFilename(filename: string): FileType | null {
  const extension = getExtension(filename)
  return ALLOWED_EXTENSIONS.includes(
    extension as (typeof ALLOWED_EXTENSIONS)[number]
  )
    ? (extension as FileType)
    : null
}
