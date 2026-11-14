'use client'

import type { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import {
  getFileExtension,
  getMaxUploadBytes,
  isFileType,
} from '@shared/utils/api.utils'
import { useState } from 'react'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { FileWithError } from '@/types/components/ScriptFilesInput.types'

type ScriptFileErrors = ResolvedStrings<
  typeof UI_STRINGS_PACK
>['scripts']['uploadModal']['fileErrors']

/** The same checks the API makes, from the same shared limits, so a file the
 * form accepts is one the upload will accept (and vice versa). */
function validateFile(file: File, fileErrors: ScriptFileErrors): string | null {
  const extension = getFileExtension(file.name)
  if (!isFileType(extension)) return fileErrors.unsupportedType(extension)

  const maxBytes = getMaxUploadBytes(extension)
  if (file.size > maxBytes) return fileErrors.tooLarge(maxBytes)
  return null
}

/**
 * Staged-file state shared by the create and edit script forms: files the
 * user picked but hasn't uploaded yet, each validated on the way in. Invalid
 * files stay listed (with their error) but are left out of `validFiles`.
 */
export function useScriptFilePicker() {
  const ui = useUIStrings()
  const { fileErrors } = ui.scripts.uploadModal
  const [files, setFiles] = useState<Array<FileWithError>>([])

  const validFiles = files.filter((entry) => entry.error === null)
  const hasErrors = files.some((entry) => entry.error !== null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const next = Array.from(incoming).map((file) => ({
      file,
      error: validateFile(file, fileErrors),
    }))
    setFiles((prev) => [...prev, ...next])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => setFiles([])

  return { files, validFiles, hasErrors, addFiles, removeFile, clearFiles }
}
