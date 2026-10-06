import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import type { FileType } from '@shared/types/api.types'

/** The kinds this project can render inline. Everything else
 * (doc/docx, xls/xlsx) falls back to download-only. */
export type PreviewableFileKind = 'pdf' | 'text' | 'image'

const IMAGE_FILE_TYPES: ReadonlyArray<FileType> = ['jpg', 'jpeg', 'png', 'webp']

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
  if (IMAGE_FILE_TYPES.includes(fileType)) return 'image'
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

/** Human-readable size for a persisted file, e.g. `850 B`, `212 KB`, `3.4 MB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`
  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(megabytes < 10 ? 1 : 0)} MB`
}
