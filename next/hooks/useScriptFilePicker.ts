'use client'

import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useState } from 'react'
import { getExtension } from '@/lib/file-preview'
import type { FileWithError } from '@/types/components/ScriptFilesInput.types'

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 // ~1MB

function validateFile(file: File): string | null {
  const extension = getExtension(file.name)
  if (
    !ALLOWED_EXTENSIONS.includes(
      extension as (typeof ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return SCRIPT_STRINGS.file.unsupportedFileType(extension)
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return SCRIPT_STRINGS.file.fileTooLarge(MAX_FILE_SIZE_BYTES / (1024 * 1024))
  }
  return null
}

/**
 * Staged-file state shared by the create and edit script forms: files the
 * user picked but hasn't uploaded yet, each validated on the way in. Invalid
 * files stay listed (with their error) but are left out of `validFiles`.
 */
export function useScriptFilePicker() {
  const [files, setFiles] = useState<Array<FileWithError>>([])

  const validFiles = files.filter((entry) => entry.error === null)
  const hasErrors = files.some((entry) => entry.error !== null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const next = Array.from(incoming).map((file) => ({
      file,
      error: validateFile(file),
    }))
    setFiles((prev) => [...prev, ...next])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => setFiles([])

  return { files, validFiles, hasErrors, addFiles, removeFile, clearFiles }
}
